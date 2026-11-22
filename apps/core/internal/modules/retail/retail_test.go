package retail

import (
	"math"
	"testing"
)

func TestCatchWeightScaleCalculation(t *testing.T) {
	// 1 kg price = Rp 120,000 (120000 cents/IDR)
	pricePerKg := int64(120000)

	testCases := []struct {
		grams         float64
		expectedCents int64
	}{
		{grams: 1000, expectedCents: 120000},
		{grams: 500, expectedCents: 60000},
		{grams: 250, expectedCents: 30000},
		{grams: 150, expectedCents: 18000},
		{grams: 333, expectedCents: 39960}, // 120000 * 333 / 1000 = 39960
	}

	for _, tc := range testCases {
		calculated := int64(math.Round(float64(pricePerKg*int64(tc.grams)) / 1000.0))
		if calculated != tc.expectedCents {
			t.Errorf("Weight %.1fg: expected Rp %d, got Rp %d", tc.grams, tc.expectedCents, calculated)
		}
	}
}

func TestCashDrawerReconciliation(t *testing.T) {
	openingFloat := int64(200000)
	totalSales := int64(1845000)
	expectedCash := openingFloat + totalSales

	if expectedCash != 2045000 {
		t.Fatalf("Expected expectedCash to be 2045000, got %d", expectedCash)
	}

	// Exact count -> zero discrepancy
	actualCashExact := int64(2045000)
	discrepancyExact := actualCashExact - expectedCash
	if discrepancyExact != 0 {
		t.Errorf("Expected 0 discrepancy, got %d", discrepancyExact)
	}

	// Shortage of Rp 5,000
	actualCashShort := int64(2040000)
	discrepancyShort := actualCashShort - expectedCash
	if discrepancyShort != -5000 {
		t.Errorf("Expected -5000 discrepancy, got %d", discrepancyShort)
	}

	// Overage of Rp 10,000
	actualCashOver := int64(2055000)
	discrepancyOver := actualCashOver - expectedCash
	if discrepancyOver != 10000 {
		t.Errorf("Expected +10000 discrepancy, got %d", discrepancyOver)
	}
}
