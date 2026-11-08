package retail

import (
	"fmt"
	"time"

	"berryfresh/core/internal/database"
	"berryfresh/core/internal/outbox"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type RetailHandler struct {
	db     *database.Database
	outbox *outbox.OutboxService
}

func NewRetailHandler(db *database.Database, outbox *outbox.OutboxService) *RetailHandler {
	return &RetailHandler{db: db, outbox: outbox}
}

type ShiftSession struct {
	ID                    string `json:"id"`
	RegisterID            string `json:"register_id"`
	RegisterCode          string `json:"register_code"`
	CashierName           string `json:"cashier_name"`
	OpenedAt              string `json:"opened_at"`
	OpeningCashFloatCents int64  `json:"opening_cash_float_cents"`
	Status                string `json:"status"`
	TotalTransactions     int    `json:"total_transactions"`
	TotalRevenueCents     int64  `json:"total_revenue_cents"`
}

var currentShift = &ShiftSession{
	ID:                    "shift-20261108-01",
	RegisterID:            "reg-jkt-01",
	RegisterCode:          "POS-REG-01",
	CashierName:           "Siti Rahma",
	OpenedAt:              "2026-11-08T08:00:00+07:00",
	OpeningCashFloatCents: 200000, // Rp 200,000 opening float
	Status:                "OPEN",
	TotalTransactions:     14,
	TotalRevenueCents:     1845000, // Rp 1,845,000
}

func (h *RetailHandler) GetCurrentShift(c fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"success": true,
		"data":    currentShift,
	})
}

type OpenShiftRequest struct {
	RegisterID            string `json:"register_id"`
	OpeningCashFloatCents int64  `json:"opening_cash_float_cents"`
}

func (h *RetailHandler) OpenShift(c fiber.Ctx) error {
	var req OpenShiftRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"success": false, "message": "Invalid request body"})
	}

	currentShift = &ShiftSession{
		ID:                    fmt.Sprintf("shift-%s", uuid.New().String()[:8]),
		RegisterID:            req.RegisterID,
		RegisterCode:          "POS-REG-01",
		CashierName:           "Store Cashier",
		OpenedAt:              time.Now().Format(time.RFC3339),
		OpeningCashFloatCents: req.OpeningCashFloatCents,
		Status:                "OPEN",
		TotalTransactions:     0,
		TotalRevenueCents:     0,
	}

	return c.JSON(fiber.Map{"success": true, "data": currentShift})
}

type CloseShiftRequest struct {
	ActualCashCents int64  `json:"actual_cash_cents"`
	Notes           string `json:"notes"`
}

func (h *RetailHandler) CloseShift(c fiber.Ctx) error {
	var req CloseShiftRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"success": false, "message": "Invalid request body"})
	}

	expectedCash := currentShift.OpeningCashFloatCents + currentShift.TotalRevenueCents
	discrepancy := req.ActualCashCents - expectedCash

	currentShift.Status = "CLOSED"

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"shift_id":              currentShift.ID,
			"status":                "CLOSED",
			"opening_cash_cents":    currentShift.OpeningCashFloatCents,
			"total_sales_cents":     currentShift.TotalRevenueCents,
			"expected_cash_cents":   expectedCash,
			"actual_cash_cents":     req.ActualCashCents,
			"discrepancy_cents":     discrepancy,
			"reconciliation_status": discrepancy == 0,
		},
	})
}

type CartItemInput struct {
	ProductID      string  `json:"product_id"`
	ProductName    string  `json:"product_name"`
	BatchID        string  `json:"batch_id,omitempty"` // Explicit batch override
	QuantityBase   float64 `json:"quantity_base"`      // grams or count
	IsCatchWeight  bool    `json:"is_catch_weight"`
	UnitPriceCents int64   `json:"unit_price_cents"`
	LineTotalCents int64   `json:"line_total_cents"`
}

type POSCheckoutRequest struct {
	Items             []CartItemInput `json:"items"`
	SubtotalCents     int64           `json:"subtotal_cents"`
	DiscountCents     int64           `json:"discount_cents"`
	TaxCents          int64           `json:"tax_cents"`
	TotalAmountCents  int64           `json:"total_amount_cents"`
	PaymentMethod     string          `json:"payment_method"` // 'CASH', 'QRIS_DYNAMIC'
	CashTenderedCents int64           `json:"cash_tendered_cents,omitempty"`
}

func (h *RetailHandler) CheckoutSale(c fiber.Ctx) error {
	var req POSCheckoutRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"success": false, "message": "Invalid checkout payload"})
	}

	receiptNumber := fmt.Sprintf("BF-%s-%04d", time.Now().Format("20060102"), currentShift.TotalTransactions+1)
	changeCents := int64(0)
	if req.PaymentMethod == "CASH" && req.CashTenderedCents > req.TotalAmountCents {
		changeCents = req.CashTenderedCents - req.TotalAmountCents
	}

	currentShift.TotalTransactions++
	currentShift.TotalRevenueCents += req.TotalAmountCents

	// Record in Transactional Outbox for inventory deduction and BI facts
	_ = h.outbox.RecordEvent(c.Context(), "pos.transaction.completed", "pos_sale", receiptNumber, map[string]interface{}{
		"receipt_number": receiptNumber,
		"store_id":       "store-jkt-central",
		"items_count":    len(req.Items),
		"total_amount":   req.TotalAmountCents,
		"payment_method": req.PaymentMethod,
		"timestamp":      time.Now().Format(time.RFC3339),
	})

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"receipt_number":      receiptNumber,
			"transacted_at":       time.Now().Format("2006-01-02 15:04:05"),
			"register_code":       currentShift.RegisterCode,
			"cashier_name":        currentShift.CashierName,
			"items":               req.Items,
			"subtotal_cents":      req.SubtotalCents,
			"discount_cents":      req.DiscountCents,
			"tax_cents":           req.TaxCents,
			"total_amount_cents":  req.TotalAmountCents,
			"payment_method":      req.PaymentMethod,
			"cash_tendered_cents": req.CashTenderedCents,
			"cash_change_cents":   changeCents,
		},
	})
}

// GenerateDynamicQRIS returns a simulated QRIS string with dynamic amount
func (h *RetailHandler) GenerateDynamicQRIS(c fiber.Ctx) error {
	amount := c.Query("amount", "50000")
	txID := uuid.New().String()[:12]
	qrisPayload := fmt.Sprintf("00020101021226670014ID.LINKAJA.WWW01189360091800000100010215%s520454115303360540%s5802ID5911BERRY FRESH6007JAKARTA62070703A016304BF92", txID, amount)

	return c.JSON(fiber.Map{
		"success":        true,
		"transaction_id": txID,
		"amount":         amount,
		"qris_string":    qrisPayload,
		"qr_image_url":   fmt.Sprintf("https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=%s", qrisPayload),
		"expires_in":     300, // 5 minutes
	})
}
