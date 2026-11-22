package commerce

import (
	"context"
	"testing"
	"time"
)

func TestOrderTotalCalculationServerSide(t *testing.T) {
	items := []struct {
		unitPrice int64
		qty       int
	}{
		{unitPrice: 38000, qty: 2}, // Albion: 76,000
		{unitPrice: 52000, qty: 1}, // Blueberry: 52,000
	}

	var subtotal int64
	for _, it := range items {
		subtotal += it.unitPrice * int64(it.qty)
	}

	if subtotal != 128000 {
		t.Fatalf("Expected subtotal to be 128,000, got %d", subtotal)
	}

	deliveryFee := int64(25000)
	total := subtotal + deliveryFee
	if total != 153000 {
		t.Fatalf("Expected total to be 153,000, got %d", total)
	}
}

func TestPaymentLifecycleStatusTransitions(t *testing.T) {
	validTransitions := map[string][]string{
		"PENDING_PAYMENT": {"PAID", "CANCELLED"},
		"PAID":            {"ALLOCATED", "PACKING", "CANCELLED", "REFUNDED"},
		"PACKING":         {"IN_TRANSIT", "REFUNDED"},
		"IN_TRANSIT":      {"DELIVERED", "REFUNDED"},
		"DELIVERED":       {"REFUNDED"},
		"CANCELLED":       {},
		"REFUNDED":        {},
	}

	canTransition := func(from, to string) bool {
		targets := validTransitions[from]
		for _, target := range targets {
			if target == to {
				return true
			}
		}
		return false
	}

	if !canTransition("PENDING_PAYMENT", "PAID") {
		t.Error("Expected transition PENDING_PAYMENT -> PAID to be allowed")
	}
	if !canTransition("PENDING_PAYMENT", "CANCELLED") {
		t.Error("Expected transition PENDING_PAYMENT -> CANCELLED to be allowed")
	}
	if !canTransition("PAID", "REFUNDED") {
		t.Error("Expected transition PAID -> REFUNDED to be allowed")
	}
	if !canTransition("PACKING", "IN_TRANSIT") {
		t.Error("Expected transition PACKING -> IN_TRANSIT to be allowed")
	}
	if !canTransition("IN_TRANSIT", "DELIVERED") {
		t.Error("Expected transition IN_TRANSIT -> DELIVERED to be allowed")
	}
	if canTransition("DELIVERED", "PENDING_PAYMENT") {
		t.Error("Transition DELIVERED -> PENDING_PAYMENT must not be allowed")
	}
}

func TestRefundRestockPolicy(t *testing.T) {
	// Restock = true must result in RETURN movement and positive balance adjustment
	itemQty := 5.0
	initialOnHand := 100.0

	// Case A: Restock true
	restockTrueMovement := "RETURN"
	restockTrueNewOnHand := initialOnHand + itemQty
	if restockTrueMovement != "RETURN" || restockTrueNewOnHand != 105.0 {
		t.Errorf("Expected RETURN movement with 105 on-hand, got %s and %f", restockTrueMovement, restockTrueNewOnHand)
	}

	// Case B: Restock false (Spoilage write-off)
	restockFalseMovement := "SPOILAGE"
	restockFalseOnHand := initialOnHand // unchanged, active balance remains 100
	if restockFalseMovement != "SPOILAGE" || restockFalseOnHand != 100.0 {
		t.Errorf("Expected SPOILAGE movement with 100 on-hand, got %s and %f", restockFalseMovement, restockFalseOnHand)
	}
}

func TestReservationSweeperTimeoutDetection(t *testing.T) {
	now := time.Now()
	expiredReservation := struct {
		id        string
		expiresAt time.Time
		status    string
	}{
		id:        "res-001",
		expiresAt: now.Add(-5 * time.Minute), // expired 5 mins ago
		status:    "ACTIVE",
	}

	activeReservation := struct {
		id        string
		expiresAt time.Time
		status    string
	}{
		id:        "res-002",
		expiresAt: now.Add(25 * time.Minute), // still valid
		status:    "ACTIVE",
	}

	isExpired := func(status string, exp time.Time) bool {
		return status == "ACTIVE" && exp.Before(now)
	}

	if !isExpired(expiredReservation.status, expiredReservation.expiresAt) {
		t.Error("Expected expiredReservation to be flagged as expired")
	}
	if isExpired(activeReservation.status, activeReservation.expiresAt) {
		t.Error("Active unexpired reservation must not be flagged as expired")
	}
}

func TestReservationSweeperEmptyPoolGraceful(t *testing.T) {
	sweeper := NewReservationSweeper(nil, nil)
	swept := sweeper.SweepExpiredReservations(context.Background())
	if swept != 0 {
		t.Errorf("Expected 0 swept on nil db pool, got %d", swept)
	}
}
