package commerce

import (
	"context"
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

type OrderCheckoutItemInput struct {
	ProductID      string `json:"product_id"`
	ProductName    string `json:"product_name,omitempty"`
	Quantity       int    `json:"quantity"`
	UnitPriceCents int64  `json:"unit_price_cents,omitempty"`
	LineTotalCents int64  `json:"line_total_cents,omitempty"`
}

type OrderCheckoutRequest struct {
	CustomerName     string                   `json:"customer_name"`
	CustomerPhone    string                   `json:"customer_phone"`
	CustomerEmail    string                   `json:"customer_email"`
	DeliveryAddress  string                   `json:"delivery_address"`
	City             string                   `json:"city"`
	PostalCode       string                   `json:"postal_code"`
	PaymentMethod    string                   `json:"payment_method"` // 'QRIS', 'BANK_TRANSFER'
	SubtotalCents    int64                    `json:"subtotal_cents,omitempty"`
	DeliveryFeeCents int64                    `json:"delivery_fee_cents,omitempty"`
	TotalAmountCents int64                    `json:"total_amount_cents,omitempty"`
	Items            []OrderCheckoutItemInput `json:"items"`
}

func (h *CommerceHandler) CheckoutOrder(c fiber.Ctx) error {
	var req OrderCheckoutRequest
	if err := c.Bind().Body(&req); err != nil || len(req.Items) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid order payload: items are required",
		})
	}

	if req.CustomerName == "" || req.CustomerPhone == "" || req.DeliveryAddress == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Customer name, phone, and delivery address are required",
		})
	}

	if req.PaymentMethod != "BANK_TRANSFER" {
		req.PaymentMethod = "QRIS"
	}

	orderNumber := fmt.Sprintf("BF-ORD-%s-%04d", time.Now().Format("20060102"), time.Now().UnixNano()%10000)
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	centralWarehouseID := "b0000000-0000-0000-0000-000000000001" // WH-JKT-MAIN

	if h.db != nil && h.db.Pool != nil {
		tx, err := h.db.Pool.Begin(ctx)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to start checkout transaction"})
		}
		defer tx.Rollback(ctx)

		// 1. Calculate server-side prices and verify product existence
		var calculatedSubtotal int64
		for idx, item := range req.Items {
			if item.Quantity <= 0 {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"success": false,
					"message": fmt.Sprintf("Item %d: Quantity must be greater than zero", idx+1),
				})
			}

			var prodID, primaryUOM string
			var prodName string
			var basePriceCents int64

			err := tx.QueryRow(ctx, `
				SELECT p.id::text, p.name, p.primary_uom_id::text, COALESCE(pp.base_price_cents, 0)
				FROM catalog.products p
				LEFT JOIN catalog.product_prices pp ON pp.product_id = p.id AND pp.channel = 'ECOMMERCE' AND pp.is_active = TRUE
				WHERE p.id::text = $1 OR p.sku = $1 OR p.barcode = $1
				LIMIT 1
			`, item.ProductID).Scan(&prodID, &prodName, &primaryUOM, &basePriceCents)

			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"success": false,
					"message": fmt.Sprintf("Item %d: Product '%s' not found in master catalog", idx+1, item.ProductID),
				})
			}

			lineTotal := basePriceCents * int64(item.Quantity)
			calculatedSubtotal += lineTotal
			req.Items[idx].ProductID = prodID
			req.Items[idx].ProductName = prodName
			req.Items[idx].UnitPriceCents = basePriceCents
			req.Items[idx].LineTotalCents = lineTotal

			// 2. FEFO Batch Allocation & Stock Reservation from Central Warehouse
			var balanceID, batchID string
			var availQty float64

			// Find oldest active Grade A batch with enough available stock
			err = tx.QueryRow(ctx, `
				SELECT sb.id::text, b.id::text, sb.quantity_available_base
				FROM inventory.stock_balances sb
				JOIN traceability.batches b ON b.id = sb.batch_id
				WHERE sb.facility_id::text = $1 AND sb.product_id::text = $2
				  AND b.status = 'ACTIVE' AND b.quality_grade = 'GRADE_A'
				  AND sb.quantity_available_base >= $3
				ORDER BY b.best_before_date ASC
				LIMIT 1
				FOR UPDATE OF sb
			`, centralWarehouseID, prodID, float64(item.Quantity)).Scan(&balanceID, &batchID, &availQty)

			if err != nil {
				// Fallback: Check any active batch regardless of grade
				err = tx.QueryRow(ctx, `
					SELECT sb.id::text, b.id::text, sb.quantity_available_base
					FROM inventory.stock_balances sb
					JOIN traceability.batches b ON b.id = sb.batch_id
					WHERE sb.facility_id::text = $1 AND sb.product_id::text = $2
					  AND b.status = 'ACTIVE'
					ORDER BY b.best_before_date ASC
					LIMIT 1
					FOR UPDATE OF sb
				`, centralWarehouseID, prodID).Scan(&balanceID, &batchID, &availQty)
			}

			if balanceID != "" {
				// Reserve stock in Central Warehouse
				_, _ = tx.Exec(ctx, `
					UPDATE inventory.stock_balances
					SET quantity_reserved_base = quantity_reserved_base + $1, updated_at = NOW()
					WHERE id::text = $2
				`, float64(item.Quantity), balanceID)

				// Record reservation
				_, _ = tx.Exec(ctx, `
					INSERT INTO inventory.stock_reservations (
						stock_balance_id, channel, reference_id, quantity_reserved_base, expires_at, status
					) VALUES ($1, 'ECOMMERCE', $2, $3, NOW() + INTERVAL '30 minutes', 'ACTIVE')
				`, balanceID, orderNumber, float64(item.Quantity))
			}
		}

		// Fixed cold-chain delivery fee calculated server-side
		deliveryFeeCents := int64(25000)
		totalAmountCents := calculatedSubtotal + deliveryFeeCents

		// 3. Find or Create Customer
		var customerID string
		err = tx.QueryRow(ctx, `
			SELECT id::text FROM commerce.customers WHERE phone = $1 OR email = $2 LIMIT 1
		`, req.CustomerPhone, req.CustomerEmail).Scan(&customerID)

		if err != nil {
			err = tx.QueryRow(ctx, `
				INSERT INTO commerce.customers (full_name, email, phone)
				VALUES ($1, $2, $3)
				RETURNING id::text
			`, req.CustomerName, req.CustomerEmail, req.CustomerPhone).Scan(&customerID)
			if err != nil {
				customerID = "70000000-0000-0000-0000-000000000001"
			}
		}

		// 4. Create Delivery Address
		var addressID string
		_ = tx.QueryRow(ctx, `
			INSERT INTO commerce.customer_addresses (
				customer_id, recipient_name, phone, street_address, city, province, postal_code, is_default
			) VALUES ($1, $2, $3, $4, $5, 'DKI Jakarta', $6, TRUE)
			RETURNING id::text
		`, customerID, req.CustomerName, req.CustomerPhone, req.DeliveryAddress, req.City, req.PostalCode).Scan(&addressID)

		// 5. Create Order
		var orderID string
		err = tx.QueryRow(ctx, `
			INSERT INTO commerce.orders (
				order_number, customer_id, delivery_address_id, status,
				subtotal_cents, delivery_fee_cents, total_amount_cents, payment_method
			) VALUES ($1, $2, $3, 'PENDING_PAYMENT', $4, $5, $6, $7)
			RETURNING id::text
		`, orderNumber, customerID, addressID, calculatedSubtotal, deliveryFeeCents, totalAmountCents, req.PaymentMethod).Scan(&orderID)

		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"message": fmt.Sprintf("Failed to create order record: %v", err),
			})
		}

		// 6. Insert Order Items
		for _, item := range req.Items {
			var uomID string
			_ = tx.QueryRow(ctx, "SELECT primary_uom_id::text FROM catalog.products WHERE id::text = $1", item.ProductID).Scan(&uomID)
			if uomID == "" {
				uomID = "d0000000-0000-0000-0000-000000000001"
			}

			_, _ = tx.Exec(ctx, `
				INSERT INTO commerce.order_items (
					order_id, product_id, ordered_quantity, uom_id, unit_price_cents, line_total_cents
				) VALUES ($1, $2, $3, $4, $5, $6)
			`, orderID, item.ProductID, float64(item.Quantity), uomID, item.UnitPriceCents, item.LineTotalCents)
		}

		// 7. Record outbox event
		_ = h.outbox.RecordEvent(ctx, "order.created", "order", orderNumber, map[string]interface{}{
			"order_id":         orderID,
			"order_number":     orderNumber,
			"customer_name":    req.CustomerName,
			"total_amount":     totalAmountCents,
			"delivery_fee":     deliveryFeeCents,
			"payment_method":   req.PaymentMethod,
			"warehouse_id":     centralWarehouseID,
			"created_at":       time.Now().Format(time.RFC3339),
		})

		// Commit
		if err := tx.Commit(ctx); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to commit order checkout"})
		}

		// Dynamic payment instruction
		qrCodeURL := fmt.Sprintf("https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=BF-PAY-%s", orderNumber)
		virtualAccount := fmt.Sprintf("88012%010d", time.Now().Unix()%1000000000)

		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"success": true,
			"data": fiber.Map{
				"order_id":           orderID,
				"order_number":       orderNumber,
				"status":             "PENDING_PAYMENT",
				"customer_name":      req.CustomerName,
				"delivery_address":   req.DeliveryAddress,
				"payment_method":     req.PaymentMethod,
				"subtotal_cents":     calculatedSubtotal,
				"delivery_fee_cents": deliveryFeeCents,
				"total_amount_cents": totalAmountCents,
				"items":              req.Items,
				"items_count":        len(req.Items),
				"created_at":         time.Now().Format(time.RFC3339),
				"qr_code_url":        qrCodeURL,
				"virtual_account":    virtualAccount,
				"bank_name":          "BCA Virtual Account",
			},
		})
	}

	// Fallback calculation for isolated mode
	subtotal := int64(0)
	for _, item := range req.Items {
		unitPrice := item.UnitPriceCents
		if unitPrice <= 0 {
			unitPrice = 38000
		}
		subtotal += unitPrice * int64(item.Quantity)
	}
	deliveryFee := int64(25000)
	total := subtotal + deliveryFee

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"order_number":       orderNumber,
			"status":             "PENDING_PAYMENT",
			"customer_name":      req.CustomerName,
			"delivery_address":   req.DeliveryAddress,
			"payment_method":     req.PaymentMethod,
			"subtotal_cents":     subtotal,
			"delivery_fee_cents": deliveryFee,
			"total_amount_cents": total,
			"items_count":        len(req.Items),
			"created_at":         time.Now().Format(time.RFC3339),
			"qr_code_url":        fmt.Sprintf("https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=BF-PAY-%s", orderNumber),
			"virtual_account":    fmt.Sprintf("88012%010d", time.Now().Unix()%1000000000),
			"bank_name":          "BCA Virtual Account",
		},
	})
}

func (h *CommerceHandler) PayOrder(c fiber.Ctx) error {
	orderID := c.Params("id")
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	if h.db != nil && h.db.Pool != nil {
		tx, err := h.db.Pool.Begin(ctx)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to start payment transaction"})
		}
		defer tx.Rollback(ctx)

		var id, orderNum, status string
		var totalAmount int64
		err = tx.QueryRow(ctx, `
			SELECT id::text, order_number, status, total_amount_cents
			FROM commerce.orders
			WHERE (id::text = $1 OR order_number = $1)
			FOR UPDATE
		`, orderID).Scan(&id, &orderNum, &status, &totalAmount)

		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"success": false, "message": "Order not found"})
		}

		if status == "PAID" {
			return c.JSON(fiber.Map{
				"success":      true,
				"message":      "Order is already paid",
				"order_number": orderNum,
				"status":       "PAID",
			})
		}

		// Update order to PAID
		_, _ = tx.Exec(ctx, `
			UPDATE commerce.orders
			SET status = 'PAID', paid_at = NOW(), updated_at = NOW()
			WHERE id::text = $1
		`, id)

		// Commit stock reservations: deduct stock on hand and release reservation hold
		rows, err := tx.Query(ctx, `
			SELECT sr.id::text, sr.stock_balance_id::text, sr.quantity_reserved_base,
			       sb.product_id::text, sb.batch_id::text, sb.quantity_on_hand_base
			FROM inventory.stock_reservations sr
			JOIN inventory.stock_balances sb ON sb.id = sr.stock_balance_id
			WHERE sr.reference_id = $1 AND sr.status = 'ACTIVE'
		`, orderNum)

		if err == nil {
			type ResItem struct {
				resID, sbID, prodID, batchID string
				qty, onHand                   float64
			}
			var resItems []ResItem
			for rows.Next() {
				var it ResItem
				if err := rows.Scan(&it.resID, &it.sbID, &it.qty, &it.prodID, &it.batchID, &it.onHand); err == nil {
					resItems = append(resItems, it)
				}
			}
			rows.Close()

			for _, it := range resItems {
				newOnHand := it.onHand - it.qty
				if newOnHand < 0 {
					newOnHand = 0
				}

				// Deduct from on hand and decrease reserved
				_, _ = tx.Exec(ctx, `
					UPDATE inventory.stock_balances
					SET quantity_on_hand_base = $1,
					    quantity_reserved_base = GREATEST(0, quantity_reserved_base - $2),
					    updated_at = NOW()
					WHERE id::text = $3
				`, newOnHand, it.qty, it.sbID)

				// Update reservation status to COMMITTED
				_, _ = tx.Exec(ctx, `
					UPDATE inventory.stock_reservations
					SET status = 'COMMITTED'
					WHERE id::text = $1
				`, it.resID)

				// Deduct from batch remaining quantity
				_, _ = tx.Exec(ctx, `
					UPDATE traceability.batches
					SET remaining_quantity_base = GREATEST(0, remaining_quantity_base - $1), updated_at = NOW()
					WHERE id::text = $2
				`, it.qty, it.batchID)

				// Append to immutable stock movements ledger
				_, _ = tx.Exec(ctx, `
					INSERT INTO inventory.stock_movements (
						movement_type, product_id, batch_id, quantity_change_base,
						running_balance_base, reference_type, reference_id, notes
					) VALUES ('ECOMMERCE_SALE', $1, $2, $3, $4, 'ecommerce_order', $5, 'Fulfilled via cold-chain express')
				`, it.prodID, it.batchID, -it.qty, newOnHand, orderNum)
			}
		}

		// Trigger outbox event
		_ = h.outbox.RecordEvent(ctx, "payment.success", "order", orderNum, map[string]interface{}{
			"order_id":     id,
			"order_number": orderNum,
			"total_amount": totalAmount,
			"paid_at":      time.Now().Format(time.RFC3339),
			"status":       "PAID",
		})

		if err := tx.Commit(ctx); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to commit payment confirmation"})
		}

		return c.JSON(fiber.Map{
			"success":      true,
			"message":      "Payment confirmed! Order dispatched to Central Warehouse for cold-chain picking.",
			"order_id":     id,
			"order_number": orderNum,
			"status":       "PAID",
		})
	}

	return c.JSON(fiber.Map{
		"success":  true,
		"message":  "Payment confirmed! Order dispatched to Central Warehouse for FEFO picking.",
		"order_id": orderID,
		"status":   "PAID",
	})
}

func (h *CommerceHandler) GetOrderByNumber(c fiber.Ctx) error {
	orderNum := c.Params("orderNumber")

	if h.db != nil && h.db.Pool != nil {
		ctx, cancel := context.WithTimeout(c.Context(), 3*time.Second)
		defer cancel()

		var id, status, customerName, paymentMethod string
		var subtotal, deliveryFee, total int64
		var createdAt string

		err := h.db.Pool.QueryRow(ctx, `
			SELECT o.id::text, o.status, c.full_name, o.payment_method,
			       o.subtotal_cents, o.delivery_fee_cents, o.total_amount_cents,
			       o.created_at::text
			FROM commerce.orders o
			JOIN commerce.customers c ON c.id = o.customer_id
			WHERE o.order_number = $1 OR o.id::text = $1
			LIMIT 1
		`, orderNum).Scan(&id, &status, &customerName, &paymentMethod, &subtotal, &deliveryFee, &total, &createdAt)

		if err == nil {
			return c.JSON(fiber.Map{
				"success": true,
				"data": fiber.Map{
					"order_id":           id,
					"order_number":       orderNum,
					"status":             status,
					"customer_name":      customerName,
					"payment_method":     paymentMethod,
					"subtotal_cents":     subtotal,
					"delivery_fee_cents": deliveryFee,
					"total_amount_cents": total,
					"created_at":         createdAt,
					"qr_code_url":        fmt.Sprintf("https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=BF-PAY-%s", orderNum),
				},
			})
		}
	}

	return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
		"success": false,
		"message": "Order not found",
	})
}
