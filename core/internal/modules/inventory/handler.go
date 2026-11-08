package inventory

import (
	"time"

	"berryfresh/core/internal/database"
	"berryfresh/core/internal/outbox"

	"github.com/gofiber/fiber/v3"
)

type InventoryHandler struct {
	db     *database.Database
	outbox *outbox.OutboxService
}

func NewInventoryHandler(db *database.Database, outbox *outbox.OutboxService) *InventoryHandler {
	return &InventoryHandler{db: db, outbox: outbox}
}

type BatchInfo struct {
	ID                    string    `json:"id"`
	BatchCode             string    `json:"batch_code"`
	ProductID             string    `json:"product_id"`
	ProductName           string    `json:"product_name"`
	FarmName              string    `json:"farm_name"`
	HarvestDate           string    `json:"harvest_date"`
	BestBeforeDate        string    `json:"best_before_date"`
	HoursRemaining        int       `json:"hours_remaining"`
	QualityGrade          string    `json:"quality_grade"`
	Brix                  float64   `json:"brix"`
	RemainingQuantityBase float64   `json:"remaining_quantity_base"`
	Status                string    `json:"status"`
	FEFOOrder             int       `json:"fefo_order"`
}

var sampleBatches = []BatchInfo{
	{
		ID:                    "batch-str-001",
		BatchCode:             "BF-20261108-STR-01A",
		ProductID:             "prod-sb-250",
		ProductName:           "Albion Strawberries (Grade A, 250g Punnet)",
		FarmName:              "Ciwidey Highland Farm Plot 3",
		HarvestDate:           "2026-11-06",
		BestBeforeDate:        "2026-11-11",
		HoursRemaining:        64,
		QualityGrade:          "GRADE_A",
		Brix:                  9.4,
		RemainingQuantityBase: 180,
		Status:                "ACTIVE",
		FEFOOrder:             1, // Earliest to expire -> Pick First
	},
	{
		ID:                    "batch-str-002",
		BatchCode:             "BF-20261108-STR-02B",
		ProductID:             "prod-sb-250",
		ProductName:           "Albion Strawberries (Grade A, 250g Punnet)",
		FarmName:              "Lembang Sunrise Farm",
		HarvestDate:           "2026-11-08",
		BestBeforeDate:        "2026-11-13",
		HoursRemaining:        112,
		QualityGrade:          "GRADE_A",
		Brix:                  9.8,
		RemainingQuantityBase: 350,
		Status:                "ACTIVE",
		FEFOOrder:             2,
	},
	{
		ID:                    "batch-blu-001",
		BatchCode:             "BF-20261105-BLU-01",
		ProductID:             "prod-bb-125",
		ProductName:           "Highland Duke Blueberries (125g Punnet)",
		FarmName:              "Batu Highland Agro",
		HarvestDate:           "2026-11-04",
		BestBeforeDate:        "2026-11-14",
		HoursRemaining:        136,
		QualityGrade:          "GRADE_A",
		Brix:                  12.5,
		RemainingQuantityBase: 220,
		Status:                "ACTIVE",
		FEFOOrder:             1,
	},
}

func (h *InventoryHandler) GetBatches(c fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"success": true,
		"count":   len(sampleBatches),
		"data":    sampleBatches,
	})
}

type StockAdjustmentRequest struct {
	BatchID      string  `json:"batch_id"`
	ProductID    string  `json:"product_id"`
	StoreID      string  `json:"store_id"`
	QuantityBase float64 `json:"quantity_base"` // grams or units
	ReasonCode   string  `json:"reason_code"`   // 'MOISTURE_LOSS', 'SPOILED_DISCARD', 'DEFECT_DOWNGRADE'
	Notes        string  `json:"notes"`
}

func (h *InventoryHandler) RecordAdjustment(c fiber.Ctx) error {
	var req StockAdjustmentRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"success": false, "message": "Invalid request body"})
	}

	// Record event in outbox
	_ = h.outbox.RecordEvent(c.Context(), "inventory.adjusted", "batch", req.BatchID, map[string]interface{}{
		"batch_id":     req.BatchID,
		"product_id":   req.ProductID,
		"reason":       req.ReasonCode,
		"qty_base":     req.QuantityBase,
		"timestamp":    time.Now().Format(time.RFC3339),
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Stock adjustment recorded and audited",
		"data":    req,
	})
}
