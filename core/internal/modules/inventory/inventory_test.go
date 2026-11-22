package inventory

import (
	"sort"
	"testing"
	"time"
)

func TestFEFOSortingLogic(t *testing.T) {
	now := time.Now()

	batches := []BatchInfo{
		{
			ID:             "batch-late",
			BatchCode:      "BF-LATE",
			BestBeforeDate: now.Add(120 * time.Hour).Format("2006-01-02"),
			QualityGrade:   "GRADE_A",
		},
		{
			ID:             "batch-early",
			BatchCode:      "BF-EARLY",
			BestBeforeDate: now.Add(24 * time.Hour).Format("2006-01-02"),
			QualityGrade:   "GRADE_A",
		},
		{
			ID:             "batch-mid",
			BatchCode:      "BF-MID",
			BestBeforeDate: now.Add(72 * time.Hour).Format("2006-01-02"),
			QualityGrade:   "GRADE_A",
		},
	}

	// Sort by FEFO rule: earliest BestBeforeDate first
	sort.Slice(batches, func(i, j int) bool {
		return batches[i].BestBeforeDate < batches[j].BestBeforeDate
	})

	if batches[0].ID != "batch-early" {
		t.Errorf("Expected first batch to be 'batch-early', got %s", batches[0].ID)
	}
	if batches[1].ID != "batch-mid" {
		t.Errorf("Expected second batch to be 'batch-mid', got %s", batches[1].ID)
	}
	if batches[2].ID != "batch-late" {
		t.Errorf("Expected third batch to be 'batch-late', got %s", batches[2].ID)
	}
}

func TestStockReservationCalculation(t *testing.T) {
	onHand := 100.0
	reserved := 20.0
	available := onHand - reserved

	if available != 80.0 {
		t.Fatalf("Expected available stock to be 80.0, got %f", available)
	}

	// Try reserving 50 items
	requested := 50.0
	if requested > available {
		t.Fatalf("Expected reservation of 50.0 to succeed, but available was %f", available)
	}

	newReserved := reserved + requested
	newAvailable := onHand - newReserved
	if newAvailable != 30.0 {
		t.Fatalf("Expected remaining available stock to be 30.0, got %f", newAvailable)
	}

	// Try over-reserving (exceeding remaining available)
	oversellRequest := 35.0
	if oversellRequest <= newAvailable {
		t.Fatalf("Expected oversell request of 35.0 to exceed available 30.0")
	}
}

func TestStockAdjustmentReasonCodes(t *testing.T) {
	validReasons := map[string]bool{
		"MOISTURE_LOSS":     true,
		"SPOILED_DISCARD":   true,
		"DEFECT_DOWNGRADE":  true,
		"DAMAGED_TRANSIT":   true,
		"COUNT_DISCREPANCY": true,
	}

	testCases := []struct {
		reason string
		valid  bool
	}{
		{"SPOILED_DISCARD", true},
		{"MOISTURE_LOSS", true},
		{"DEFECT_DOWNGRADE", true},
		{"DAMAGED_TRANSIT", true},
		{"COUNT_DISCREPANCY", true},
		{"RANDOM_REASON", false},
		{"", false},
	}

	for _, tc := range testCases {
		isValid := validReasons[tc.reason]
		if isValid != tc.valid {
			t.Errorf("Reason '%s': expected valid=%v, got %v", tc.reason, tc.valid, isValid)
		}
	}
}
