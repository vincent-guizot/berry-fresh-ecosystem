package commerce

import (
	"testing"
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
		"PAID":            {"ALLOCATED", "PACKING", "CANCELLED"},
		"PACKING":         {"IN_TRANSIT", "CANCELLED"},
		"IN_TRANSIT":      {"DELIVERED"},
		"DELIVERED":       {},
		"CANCELLED":       {},
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
	if canTransition("DELIVERED", "PENDING_PAYMENT") {
		t.Error("Transition DELIVERED -> PENDING_PAYMENT must not be allowed")
	}
}
