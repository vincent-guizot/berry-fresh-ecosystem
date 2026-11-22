package commerce

import (
	"context"
	"fmt"
	"log"
	"strconv"
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
		itemBatchMap := make(map[string]string)
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
				if batchID != "" {
					itemBatchMap[prodID] = batchID
				}
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

			bID := itemBatchMap[item.ProductID]
			if bID != "" {
				_, _ = tx.Exec(ctx, `
					INSERT INTO commerce.order_items (
						order_id, product_id, batch_id, ordered_quantity, uom_id, unit_price_cents, line_total_cents
					) VALUES ($1, $2, $3, $4, $5, $6, $7)
				`, orderID, item.ProductID, bID, float64(item.Quantity), uomID, item.UnitPriceCents, item.LineTotalCents)
			} else {
				_, _ = tx.Exec(ctx, `
					INSERT INTO commerce.order_items (
						order_id, product_id, ordered_quantity, uom_id, unit_price_cents, line_total_cents
					) VALUES ($1, $2, $3, $4, $5, $6)
				`, orderID, item.ProductID, float64(item.Quantity), uomID, item.UnitPriceCents, item.LineTotalCents)
			}
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
		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		var id, status, customerName, customerPhone, customerEmail, paymentMethod string
		var deliveryAddress string
		var subtotal, deliveryFee, total, refundAmount int64
		var refundReason string
		var createdAt, paidAt, refundedAt *string

		err := h.db.Pool.QueryRow(ctx, `
			SELECT o.id::text, o.order_number, o.status,
			       c.full_name, COALESCE(c.phone, ''), COALESCE(c.email, ''),
			       COALESCE(ca.street_address || ', ' || ca.city || ', ' || ca.province || ' ' || ca.postal_code, 'Alamat Default'),
			       o.payment_method, o.subtotal_cents, o.delivery_fee_cents, o.total_amount_cents,
			       COALESCE(o.refund_amount_cents, 0), COALESCE(o.refund_reason, ''),
			       o.created_at::text, o.paid_at::text, o.refunded_at::text
			FROM commerce.orders o
			JOIN commerce.customers c ON c.id = o.customer_id
			LEFT JOIN commerce.customer_addresses ca ON ca.id = o.delivery_address_id
			WHERE o.order_number = $1 OR o.id::text = $1
			LIMIT 1
		`, orderNum).Scan(
			&id, &orderNum, &status,
			&customerName, &customerPhone, &customerEmail,
			&deliveryAddress,
			&paymentMethod, &subtotal, &deliveryFee, &total,
			&refundAmount, &refundReason,
			&createdAt, &paidAt, &refundedAt,
		)

		if err == nil {
			// Fetch order items
			type OrderItemDetail struct {
				ProductID      string  `json:"product_id"`
				ProductName    string  `json:"product_name"`
				BatchCode      string  `json:"batch_code"`
				Quantity       float64 `json:"quantity"`
				UnitPriceCents int64   `json:"unit_price_cents"`
				LineTotalCents int64   `json:"line_total_cents"`
			}
			var items []OrderItemDetail

			rows, itemErr := h.db.Pool.Query(ctx, `
				SELECT oi.product_id::text, p.name, COALESCE(b.batch_code, '-'),
				       oi.ordered_quantity, oi.unit_price_cents, oi.line_total_cents
				FROM commerce.order_items oi
				JOIN catalog.products p ON p.id = oi.product_id
				LEFT JOIN traceability.batches b ON b.id = oi.batch_id
				WHERE oi.order_id::text = $1
			`, id)

			if itemErr == nil {
				for rows.Next() {
					var item OrderItemDetail
					if err := rows.Scan(&item.ProductID, &item.ProductName, &item.BatchCode, &item.Quantity, &item.UnitPriceCents, &item.LineTotalCents); err == nil {
						items = append(items, item)
					}
				}
				rows.Close()
			}

			return c.JSON(fiber.Map{
				"success": true,
				"data": fiber.Map{
					"order_id":            id,
					"order_number":        orderNum,
					"status":              status,
					"customer_name":       customerName,
					"customer_phone":      customerPhone,
					"customer_email":      customerEmail,
					"delivery_address":    deliveryAddress,
					"payment_method":      paymentMethod,
					"subtotal_cents":      subtotal,
					"delivery_fee_cents":  deliveryFee,
					"total_amount_cents":  total,
					"refund_amount_cents": refundAmount,
					"refund_reason":       refundReason,
					"created_at":          createdAt,
					"paid_at":             paidAt,
					"refunded_at":         refundedAt,
					"items":               items,
					"items_count":         len(items),
					"qr_code_url":         fmt.Sprintf("https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=BF-PAY-%s", orderNum),
					"virtual_account":     fmt.Sprintf("88012%010d", time.Now().Unix()%1000000000),
					"bank_name":           "BCA Virtual Account",
				},
			})
		}
	}

	return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
		"success": false,
		"message": "Order not found",
	})
}

// GetOrders retrieves all e-commerce orders with status filtering and pagination for Studio / Backoffice.
func (h *CommerceHandler) GetOrders(c fiber.Ctx) error {
	status := c.Query("status")
	search := c.Query("search")
	limit, _ := strconv.Atoi(c.Query("limit", "50"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	if h.db != nil && h.db.Pool != nil {
		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		baseQuery := `
			SELECT o.id::text, o.order_number, o.status, c.full_name, COALESCE(c.phone, ''),
			       COALESCE(ca.street_address, 'Alamat Default') AS address,
			       o.payment_method, o.subtotal_cents, o.delivery_fee_cents, o.total_amount_cents,
			       COALESCE(o.refund_amount_cents, 0), COALESCE(o.refund_reason, ''),
			       o.paid_at::text, o.refunded_at::text, o.created_at::text,
			       (SELECT COUNT(*) FROM commerce.order_items WHERE order_id = o.id) AS item_count
			FROM commerce.orders o
			JOIN commerce.customers c ON c.id = o.customer_id
			LEFT JOIN commerce.customer_addresses ca ON ca.id = o.delivery_address_id
			WHERE 1=1
		`
		var args []interface{}
		argIdx := 1

		if status != "" && status != "ALL" {
			baseQuery += fmt.Sprintf(" AND o.status = $%d", argIdx)
			args = append(args, status)
			argIdx++
		}

		if search != "" {
			baseQuery += fmt.Sprintf(" AND (o.order_number ILIKE $%d OR c.full_name ILIKE $%d OR c.phone ILIKE $%d)", argIdx, argIdx, argIdx)
			args = append(args, "%"+search+"%")
			argIdx++
		}

		baseQuery += fmt.Sprintf(" ORDER BY o.created_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
		args = append(args, limit, offset)

		rows, err := h.db.Pool.Query(ctx, baseQuery, args...)
		if err == nil {
			var orders []fiber.Map
			for rows.Next() {
				var id, orderNum, st, custName, phone, address, payMethod string
				var subtotal, deliveryFee, total, refundAmount int64
				var refundReason string
				var paidAt, refundedAt, createdAt *string
				var itemCount int

				if err := rows.Scan(
					&id, &orderNum, &st, &custName, &phone, &address,
					&payMethod, &subtotal, &deliveryFee, &total,
					&refundAmount, &refundReason,
					&paidAt, &refundedAt, &createdAt, &itemCount,
				); err == nil {
					orders = append(orders, fiber.Map{
						"id":                  id,
						"order_number":        orderNum,
						"status":              st,
						"customer_name":       custName,
						"customer_phone":      phone,
						"delivery_address":    address,
						"payment_method":      payMethod,
						"subtotal_cents":      subtotal,
						"delivery_fee_cents":  deliveryFee,
						"total_amount_cents":  total,
						"refund_amount_cents": refundAmount,
						"refund_reason":       refundReason,
						"paid_at":             paidAt,
						"refunded_at":         refundedAt,
						"created_at":          createdAt,
						"item_count":          itemCount,
					})
				}
			}
			rows.Close()

			return c.JSON(fiber.Map{
				"success": true,
				"data":    orders,
				"count":   len(orders),
			})
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    []fiber.Map{},
		"count":   0,
	})
}

// CancelOrder handles cancellation of unpaid orders (PENDING_PAYMENT), releasing held stock reservations.
func (h *CommerceHandler) CancelOrder(c fiber.Ctx) error {
	orderID := c.Params("id")
	type CancelReq struct {
		Reason string `json:"reason"`
	}
	var req CancelReq
	_ = c.Bind().Body(&req)
	if req.Reason == "" {
		req.Reason = "Dibatalkan oleh pelanggan"
	}

	if h.db != nil && h.db.Pool != nil {
		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		tx, err := h.db.Pool.Begin(ctx)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to start cancellation transaction"})
		}
		defer tx.Rollback(ctx)

		var id, orderNum, status string
		err = tx.QueryRow(ctx, `
			SELECT id::text, order_number, status
			FROM commerce.orders
			WHERE id::text = $1 OR order_number = $1
			FOR UPDATE
		`, orderID).Scan(&id, &orderNum, &status)

		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"success": false, "message": "Order not found"})
		}

		if status == "CANCELLED" {
			return c.JSON(fiber.Map{
				"success":      true,
				"message":      "Order is already cancelled",
				"order_number": orderNum,
				"status":       "CANCELLED",
			})
		}

		if status != "PENDING_PAYMENT" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"message": fmt.Sprintf("Pesanan dengan status '%s' tidak dapat dibatalkan langsung. Gunakan alur Refund untuk pesanan yang sudah dibayar.", status),
			})
		}

		// 1. Release active reservations and restore reserved balances
		rows, err := tx.Query(ctx, `
			SELECT id::text, stock_balance_id::text, quantity_reserved_base
			FROM inventory.stock_reservations
			WHERE reference_id = $1 AND status = 'ACTIVE'
			FOR UPDATE
		`, orderNum)

		if err == nil {
			type ResItem struct {
				id, balanceID string
				qty           float64
			}
			var resItems []ResItem
			for rows.Next() {
				var it ResItem
				if err := rows.Scan(&it.id, &it.balanceID, &it.qty); err == nil {
					resItems = append(resItems, it)
				}
			}
			rows.Close()

			for _, it := range resItems {
				_, _ = tx.Exec(ctx, `
					UPDATE inventory.stock_balances
					SET quantity_reserved_base = GREATEST(0, quantity_reserved_base - $1), updated_at = NOW()
					WHERE id::text = $2
				`, it.qty, it.balanceID)

				_, _ = tx.Exec(ctx, `
					UPDATE inventory.stock_reservations
					SET status = 'RELEASED'
					WHERE id::text = $1
				`, it.id)
			}
		}

		// 2. Update order status to CANCELLED
		_, err = tx.Exec(ctx, `
			UPDATE commerce.orders
			SET status = 'CANCELLED', refund_reason = $1, updated_at = NOW()
			WHERE id::text = $2
		`, req.Reason, id)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to update order status"})
		}

		// 3. Record outbox event
		_ = h.outbox.RecordEvent(ctx, "order.cancelled", "order", orderNum, map[string]interface{}{
			"order_id":     id,
			"order_number": orderNum,
			"reason":       req.Reason,
			"status":       "CANCELLED",
		})

		if err := tx.Commit(ctx); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to commit order cancellation"})
		}

		return c.JSON(fiber.Map{
			"success":      true,
			"message":      "Order berhasil dibatalkan dan alokasi reservasi stok telah dibebaskan.",
			"order_id":     id,
			"order_number": orderNum,
			"status":       "CANCELLED",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Order cancelled (mock mode)",
		"status":  "CANCELLED",
	})
}

// RefundOrder handles refund for paid orders, allowing flexible choice between restocking or spoilage write-off.
func (h *CommerceHandler) RefundOrder(c fiber.Ctx) error {
	orderID := c.Params("id")
	type RefundReq struct {
		Reason  string `json:"reason"`
		Restock bool   `json:"restock"`
	}
	var req RefundReq
	_ = c.Bind().Body(&req)
	if req.Reason == "" {
		req.Reason = "Pengembalian dana pelanggan (Refund)"
	}

	if h.db != nil && h.db.Pool != nil {
		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		tx, err := h.db.Pool.Begin(ctx)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to start refund transaction"})
		}
		defer tx.Rollback(ctx)

		var id, orderNum, status string
		var totalAmount int64
		err = tx.QueryRow(ctx, `
			SELECT id::text, order_number, status, total_amount_cents
			FROM commerce.orders
			WHERE id::text = $1 OR order_number = $1
			FOR UPDATE
		`, orderID).Scan(&id, &orderNum, &status, &totalAmount)

		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"success": false, "message": "Order not found"})
		}

		if status == "REFUNDED" {
			return c.JSON(fiber.Map{
				"success":      true,
				"message":      "Order is already refunded",
				"order_number": orderNum,
				"status":       "REFUNDED",
			})
		}

		if status == "PENDING_PAYMENT" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"message": "Pesanan belum dibayar. Gunakan /cancel untuk membatalkan pesanan yang belum dibayar.",
			})
		}

		if status == "CANCELLED" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"message": "Pesanan sudah dibatalkan sebelumnya sebelum pembayaran.",
			})
		}

		// Retrieve Central Cold Storage Warehouse ID
		var centralWarehouseID string
		_ = tx.QueryRow(ctx, `
			SELECT id::text FROM governance.facilities WHERE code = 'WH-JKT-MAIN' LIMIT 1
		`).Scan(&centralWarehouseID)
		if centralWarehouseID == "" {
			centralWarehouseID = "20000000-0000-0000-0000-000000000001"
		}

		// Fetch items for this order
		rows, err := tx.Query(ctx, `
			SELECT product_id::text, COALESCE(batch_id::text, ''), ordered_quantity
			FROM commerce.order_items
			WHERE order_id::text = $1
		`, id)

		if err == nil {
			type OrderItem struct {
				productID, batchID string
				qty                float64
			}
			var items []OrderItem
			for rows.Next() {
				var it OrderItem
				if err := rows.Scan(&it.productID, &it.batchID, &it.qty); err == nil {
					items = append(items, it)
				}
			}
			rows.Close()

			for _, it := range items {
				if it.batchID == "" {
					_ = tx.QueryRow(ctx, `
						SELECT id::text FROM traceability.batches
						WHERE product_id::text = $1 AND status = 'ACTIVE'
						ORDER BY best_before_date ASC LIMIT 1
					`, it.productID).Scan(&it.batchID)
				}
				if it.batchID == "" {
					_ = tx.QueryRow(ctx, `SELECT id::text FROM traceability.batches LIMIT 1`).Scan(&it.batchID)
				}

				if req.Restock {
					// 1. Restock to physical inventory balance in Warehouse
					var newOnHand float64
					err = tx.QueryRow(ctx, `
						UPDATE inventory.stock_balances
						SET quantity_on_hand_base = quantity_on_hand_base + $1, updated_at = NOW()
						WHERE product_id::text = $2 AND facility_id::text = $3
						RETURNING quantity_on_hand_base
					`, it.qty, it.productID, centralWarehouseID).Scan(&newOnHand)

					if err != nil {
						_ = tx.QueryRow(ctx, `
							UPDATE inventory.stock_balances
							SET quantity_on_hand_base = quantity_on_hand_base + $1, updated_at = NOW()
							WHERE product_id::text = $2
							RETURNING quantity_on_hand_base
						`, it.qty, it.productID).Scan(&newOnHand)
					}

					// 2. Restock batch remaining quantity
					if it.batchID != "" {
						_, _ = tx.Exec(ctx, `
							UPDATE traceability.batches
							SET remaining_quantity_base = remaining_quantity_base + $1, updated_at = NOW()
							WHERE id::text = $2
						`, it.qty, it.batchID)
					}

					// 3. Append to stock movement ledger as RETURN
					_, err = tx.Exec(ctx, `
						INSERT INTO inventory.stock_movements (
							movement_type, facility_id, product_id, batch_id,
							quantity_change_base, running_balance_base, reference_type, reference_id, notes
						) VALUES ('RETURN', $1, $2, $3, $4, $5, 'order_refund', $6, $7)
					`, centralWarehouseID, it.productID, it.batchID, it.qty, newOnHand, orderNum, req.Reason)
					if err != nil {
						log.Printf("[RefundOrder] Return movement error: %v", err)
					}
				} else {
					// Spoilage write-off (perishable fruit disposed / compromised cold chain)
					var currentOnHand float64
					_ = tx.QueryRow(ctx, `
						SELECT quantity_on_hand_base FROM inventory.stock_balances
						WHERE product_id::text = $1 AND facility_id::text = $2 LIMIT 1
					`, it.productID, centralWarehouseID).Scan(&currentOnHand)

					_, err = tx.Exec(ctx, `
						INSERT INTO inventory.stock_movements (
							movement_type, facility_id, product_id, batch_id,
							quantity_change_base, running_balance_base, reference_type, reference_id, notes
						) VALUES ('SPOILAGE', $1, $2, $3, $4, $5, 'order_spoilage_writeoff', $6, $7)
					`, centralWarehouseID, it.productID, it.batchID, -it.qty, currentOnHand, orderNum, fmt.Sprintf("[Spoilage Write-Off] %s", req.Reason))
					if err != nil {
						log.Printf("[RefundOrder] Spoilage movement error: %v", err)
					}
				}
			}
		}

		// Update order status to REFUNDED
		_, err = tx.Exec(ctx, `
			UPDATE commerce.orders
			SET status = 'REFUNDED', refund_amount_cents = total_amount_cents,
			    refund_reason = $1, refunded_at = NOW(), updated_at = NOW()
			WHERE id::text = $2
		`, req.Reason, id)
		if err != nil {
			log.Printf("[RefundOrder] Error updating order status: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": fmt.Sprintf("Failed to update order to refunded: %v", err)})
		}

		// Record outbox event
		_ = h.outbox.RecordEvent(ctx, "order.refunded", "order", orderNum, map[string]interface{}{
			"order_id":      id,
			"order_number":  orderNum,
			"refund_amount": totalAmount,
			"restocked":     req.Restock,
			"reason":        req.Reason,
			"status":        "REFUNDED",
		})

		if err := tx.Commit(ctx); err != nil {
			log.Printf("[RefundOrder] Error committing tx: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": fmt.Sprintf("Failed to commit refund transaction: %v", err)})
		}

		return c.JSON(fiber.Map{
			"success":             true,
			"message":             "Pesanan berhasil di-refund. Dana dikembalikan dan audit stok telah dicatat.",
			"order_id":            id,
			"order_number":        orderNum,
			"status":              "REFUNDED",
			"refund_amount_cents": totalAmount,
			"restocked":           req.Restock,
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Order refunded (mock mode)",
		"status":  "REFUNDED",
	})
}

// UpdateFulfillment handles fulfillment stages: PACKING -> IN_TRANSIT -> DELIVERED.
func (h *CommerceHandler) UpdateFulfillment(c fiber.Ctx) error {
	orderID := c.Params("id")
	type FulfillmentReq struct {
		Status string `json:"status"` // PACKING, IN_TRANSIT, DELIVERED
		Notes  string `json:"notes"`
	}
	var req FulfillmentReq
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"success": false, "message": "Format request tidak valid"})
	}

	if req.Status != "PACKING" && req.Status != "IN_TRANSIT" && req.Status != "DELIVERED" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Status fulfillment tidak valid. Pilihan: PACKING, IN_TRANSIT, DELIVERED",
		})
	}

	if h.db != nil && h.db.Pool != nil {
		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		tx, err := h.db.Pool.Begin(ctx)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to begin fulfillment update"})
		}
		defer tx.Rollback(ctx)

		var id, orderNum, currentStatus string
		err = tx.QueryRow(ctx, `
			SELECT id::text, order_number, status
			FROM commerce.orders
			WHERE id::text = $1 OR order_number = $1
			FOR UPDATE
		`, orderID).Scan(&id, &orderNum, &currentStatus)

		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"success": false, "message": "Order not found"})
		}

		if currentStatus == "CANCELLED" || currentStatus == "REFUNDED" || currentStatus == "PENDING_PAYMENT" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"message": fmt.Sprintf("Pesanan dengan status '%s' tidak dapat diproses ke tahap pengiriman.", currentStatus),
			})
		}

		_, err = tx.Exec(ctx, `
			UPDATE commerce.orders
			SET status = $1, updated_at = NOW()
			WHERE id::text = $2
		`, req.Status, id)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to update fulfillment status"})
		}

		_ = h.outbox.RecordEvent(ctx, "order.fulfillment_updated", "order", orderNum, map[string]interface{}{
			"order_id":     id,
			"order_number": orderNum,
			"from_status":  currentStatus,
			"to_status":    req.Status,
			"notes":        req.Notes,
		})

		if err := tx.Commit(ctx); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"success": false, "message": "Failed to commit fulfillment status"})
		}

		return c.JSON(fiber.Map{
			"success":      true,
			"message":      fmt.Sprintf("Status pesanan berhasil diperbarui menjadi '%s'.", req.Status),
			"order_id":     id,
			"order_number": orderNum,
			"status":       req.Status,
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"status":  req.Status,
		"message": "Fulfillment status updated (mock mode)",
	})
}
