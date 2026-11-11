package commerce

import (
	"fmt"
	"time"

	"berryfresh/core/internal/database"
	"berryfresh/core/internal/outbox"

	"github.com/gofiber/fiber/v3"
)

type CommerceHandler struct {
	db     *database.Database
	outbox *outbox.OutboxService
}

func NewCommerceHandler(db *database.Database, outbox *outbox.OutboxService) *CommerceHandler {
	return &CommerceHandler{db: db, outbox: outbox}
}

type OrderCheckoutRequest struct {
	CustomerName     string `json:"customer_name"`
	CustomerPhone    string `json:"customer_phone"`
	CustomerEmail    string `json:"customer_email"`
	DeliveryAddress  string `json:"delivery_address"`
	City             string `json:"city"`
	PostalCode       string `json:"postal_code"`
	PaymentMethod    string `json:"payment_method"` // 'QRIS', 'BANK_TRANSFER'
	SubtotalCents    int64  `json:"subtotal_cents"`
	DeliveryFeeCents int64  `json:"delivery_fee_cents"`
	TotalAmountCents int64  `json:"total_amount_cents"`
	Items            []struct {
		ProductID      string `json:"product_id"`
		ProductName    string `json:"product_name"`
		Quantity       int    `json:"quantity"`
		UnitPriceCents int64  `json:"unit_price_cents"`
		LineTotalCents int64  `json:"line_total_cents"`
	} `json:"items"`
}

func (h *CommerceHandler) CheckoutOrder(c fiber.Ctx) error {
	var req OrderCheckoutRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"success": false, "message": "Invalid order payload"})
	}

	orderNumber := fmt.Sprintf("BF-ORD-%s-%04d", time.Now().Format("20060102"), time.Now().Unix()%10000)

	// Record outbox event: order.created
	_ = h.outbox.RecordEvent(c.Context(), "order.created", "order", orderNumber, map[string]interface{}{
		"order_number":   orderNumber,
		"customer_name":  req.CustomerName,
		"total_amount":   req.TotalAmountCents,
		"payment_method": req.PaymentMethod,
		"created_at":     time.Now().Format(time.RFC3339),
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"order_number":       orderNumber,
			"status":             "PENDING_PAYMENT",
			"customer_name":      req.CustomerName,
			"delivery_address":   req.DeliveryAddress,
			"payment_method":     req.PaymentMethod,
			"total_amount_cents": req.TotalAmountCents,
			"items_count":        len(req.Items),
			"created_at":         time.Now().Format(time.RFC3339),
			"qr_code_url":        fmt.Sprintf("https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=BF-PAY-%s", orderNumber),
		},
	})
}

func (h *CommerceHandler) PayOrder(c fiber.Ctx) error {
	orderID := c.Params("id")

	// Trigger outbox event: payment.success -> picker notified to pack FEFO batch
	_ = h.outbox.RecordEvent(c.Context(), "payment.success", "order", orderID, map[string]interface{}{
		"order_id": orderID,
		"paid_at":  time.Now().Format(time.RFC3339),
		"status":   "PAID",
	})

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Payment confirmed! Order dispatched to Central Warehouse for FEFO picking.",
		"order_id": orderID,
		"status":   "PAID",
	})
}
