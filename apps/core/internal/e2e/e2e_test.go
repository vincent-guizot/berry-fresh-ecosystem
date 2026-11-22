package e2e

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"berryfresh/core/internal/config"
	"berryfresh/core/internal/database"
	"berryfresh/core/internal/middleware"
	"berryfresh/core/internal/modules/analytics"
	"berryfresh/core/internal/modules/catalog"
	"berryfresh/core/internal/modules/commerce"
	"berryfresh/core/internal/modules/identity"
	"berryfresh/core/internal/modules/inventory"
	"berryfresh/core/internal/modules/retail"
	"berryfresh/core/internal/outbox"

	"github.com/gofiber/fiber/v3"
)

func buildTestApp(cfg *config.Config, db *database.Database, outboxSvc *outbox.OutboxService) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      cfg.AppName,
		ServerHeader: "Berry-Fresh-Core/1.0",
	})
	app.Use(middleware.NewCORS(cfg.CORSAllowOrigins))

	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":         "healthy",
			"app_name":       cfg.AppName,
			"environment":    cfg.AppEnv,
			"database_ready": db.IsConnected(),
			"outbox_active":  true,
			"timestamp":      time.Now().Format(time.RFC3339),
			"version":        "1.0.0",
		})
	})

	authHandler := identity.NewAuthHandler(cfg, db)
	catalogHandler := catalog.NewCatalogHandler(db)
	inventoryHandler := inventory.NewInventoryHandler(db, outboxSvc)
	retailHandler := retail.NewRetailHandler(db, outboxSvc)
	commerceHandler := commerce.NewCommerceHandler(db, outboxSvc)
	analyticsHandler := analytics.NewAnalyticsHandler(db)

	api := app.Group("/api/v1")

	// 1. Identity & Auth
	auth := api.Group("/auth")
	auth.Post("/login", authHandler.Login)
	auth.Get("/me", authHandler.Me, middleware.RequireAuth(cfg.JWTAccessSecret))

	// 2. Catalog
	cat := api.Group("/catalog")
	cat.Get("/products", catalogHandler.GetProducts)
	cat.Get("/products/:id", catalogHandler.GetProductByID)
	cat.Get("/plu-quick-keys", catalogHandler.GetPLUQuickKeys)

	// 3. Inventory & Batches
	inv := api.Group("/inventory")
	inv.Get("/batches", inventoryHandler.GetBatches)
	inv.Get("/balances", inventoryHandler.GetBalances)
	inv.Post("/adjustments", inventoryHandler.RecordAdjustment)

	// 4. Retail POS
	ret := api.Group("/retail")
	ret.Get("/shifts/current", retailHandler.GetCurrentShift)
	ret.Get("/shifts/history", retailHandler.GetShiftHistory)
	ret.Post("/shifts/open", retailHandler.OpenShift)
	ret.Post("/shifts/close", retailHandler.CloseShift)
	ret.Post("/sales/checkout", retailHandler.CheckoutSale)
	ret.Get("/sales/qris/generate", retailHandler.GenerateDynamicQRIS)

	// 5. Commerce
	comm := api.Group("/commerce")
	comm.Get("/orders", commerceHandler.GetOrders)
	comm.Post("/orders/checkout", commerceHandler.CheckoutOrder)
	comm.Post("/orders/:id/pay", commerceHandler.PayOrder)
	comm.Post("/orders/:id/cancel", commerceHandler.CancelOrder)
	comm.Post("/orders/:id/refund", commerceHandler.RefundOrder)
	comm.Patch("/orders/:id/fulfillment", commerceHandler.UpdateFulfillment)
	comm.Get("/orders/:orderNumber", commerceHandler.GetOrderByNumber)

	// 6. Analytics
	anl := api.Group("/analytics")
	anl.Get("/overview", analyticsHandler.GetOverview)

	return app
}

func initTestEnv(t *testing.T) (*config.Config, *database.Database, *fiber.App, func()) {
	cfg := config.LoadConfig()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:admin@localhost:1000/berryfresh_db?sslmode=disable"
	}
	cfg.DatabaseURL = dbURL

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	db, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil || !db.IsConnected() {
		t.Skip("PostgreSQL not accessible, skipping E2E test suite")
	}

	outboxSvc := outbox.NewOutboxService(db.Pool, cfg.RabbitMQURL, cfg.RabbitMQExchange)
	app := buildTestApp(cfg, db, outboxSvc)

	cleanup := func() {
		db.Close()
	}

	return cfg, db, app, cleanup
}

func TestE2EHealthCheck(t *testing.T) {
	_, _, app, cleanup := initTestEnv(t)
	defer cleanup()

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Health check request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected 200 OK, got %d", resp.StatusCode)
	}

	var body map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&body)
	if body["status"] != "healthy" {
		t.Errorf("Expected status 'healthy', got %v", body["status"])
	}
	if body["database_ready"] != true {
		t.Errorf("Expected database_ready true, got %v", body["database_ready"])
	}
}

func TestE2EIdentityAndRBAC(t *testing.T) {
	_, _, app, cleanup := initTestEnv(t)
	defer cleanup()

	// 1. Invalid login
	loginBad := map[string]string{
		"email":    "nonexistent@berryfresh.com",
		"password": "wrongpassword",
	}
	badPayload, _ := json.Marshal(loginBad)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(badPayload))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Login request failed: %v", err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for bad login, got %d", resp.StatusCode)
	}

	// 2. Valid Cashier login
	loginGood := map[string]string{
		"email":    "cashier@berryfresh.com",
		"password": "pos123",
	}
	goodPayload, _ := json.Marshal(loginGood)
	req = httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(goodPayload))
	req.Header.Set("Content-Type", "application/json")
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("Cashier login failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200 OK for valid cashier login, got %d", resp.StatusCode)
	}

	var loginResp map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&loginResp)
	token, ok := loginResp["access_token"].(string)
	if !ok || token == "" {
		t.Fatalf("Expected valid JWT token in login response: %v", loginResp)
	}

	// 3. Test /me with Bearer token
	req = httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("/me request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200 OK on /me, got %d", resp.StatusCode)
	}

	var meResp map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&meResp)
	user := meResp["user"].(map[string]interface{})
	if user["email"] != "cashier@berryfresh.com" {
		t.Errorf("Expected email cashier@berryfresh.com, got %v", user["email"])
	}
	if user["role"] != "CASHIER" {
		t.Errorf("Expected role CASHIER, got %v", user["role"])
	}

	// 4. Test /me without token -> 401
	reqUnauth := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	respUnauth, _ := app.Test(reqUnauth)
	if respUnauth.StatusCode != http.StatusUnauthorized {
		t.Errorf("Expected 401 for missing token, got %d", respUnauth.StatusCode)
	}
}

func TestE2ECatalogContract(t *testing.T) {
	_, _, app, cleanup := initTestEnv(t)
	defer cleanup()

	// 1. Get products list
	req := httptest.NewRequest(http.MethodGet, "/api/v1/catalog/products", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Catalog products request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected 200 OK, got %d", resp.StatusCode)
	}

	var prodBody map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&prodBody)
	items, ok := prodBody["data"].([]interface{})
	if !ok || len(items) == 0 {
		t.Fatalf("Expected non-empty products list in catalog response")
	}

	firstItem := items[0].(map[string]interface{})
	if firstItem["sku"] == "" || firstItem["name"] == "" {
		t.Errorf("Product missing SKU or Name: %v", firstItem)
	}

	// 2. Get PLU quick keys for POS
	reqPLU := httptest.NewRequest(http.MethodGet, "/api/v1/catalog/plu-quick-keys", nil)
	respPLU, err := app.Test(reqPLU)
	if err != nil {
		t.Fatalf("PLU keys request failed: %v", err)
	}
	if respPLU.StatusCode != http.StatusOK {
		t.Errorf("Expected 200 OK, got %d", respPLU.StatusCode)
	}
}

func TestE2ECommerceJourney(t *testing.T) {
	_, db, app, cleanup := initTestEnv(t)
	defer cleanup()

	// Fetch a real product ID from database
	var prodID string
	err := db.Pool.QueryRow(context.Background(), "SELECT id FROM catalog.products WHERE sku = 'BF-STR-ALB-250G'").Scan(&prodID)
	if err != nil {
		t.Fatalf("Failed to fetch test product: %v", err)
	}

	// 1. Checkout Order
	checkoutReq := map[string]interface{}{
		"customer_name":    "E2E Test Customer",
		"customer_phone":   "+6281299998888",
		"customer_email":   "e2e.test@example.com",
		"delivery_address": "Jl. Sudirman Kav 52, SCBD, Jakarta Selatan",
		"payment_method":   "QRIS",
		"items": []map[string]interface{}{
			{
				"product_id": prodID,
				"quantity":   2,
			},
		},
	}
	payload, _ := json.Marshal(checkoutReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/commerce/orders/checkout", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Order checkout request failed: %v", err)
	}
	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("Expected 201 Created on checkout, got %d: %s", resp.StatusCode, string(body))
	}

	var orderResp map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&orderResp)
	data, ok := orderResp["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("Order response missing data map: %v", orderResp)
	}
	orderID, _ := data["order_id"].(string)
	orderNumber, _ := data["order_number"].(string)
	if orderID == "" || orderNumber == "" {
		t.Fatalf("Order data missing order_id or order_number: %v", data)
	}

	// Verify server-side total: 2 * 38000 + 25000 delivery fee = 101,000
	grandTotal, _ := data["total_amount_cents"].(float64)
	if int64(grandTotal) != 101000 {
		t.Errorf("Expected grand total 101,000 IDR, got %v", grandTotal)
	}

	// 2. Query Order by Order Number
	reqQuery := httptest.NewRequest(http.MethodGet, "/api/v1/commerce/orders/"+orderNumber, nil)
	respQuery, err := app.Test(reqQuery)
	if err != nil || respQuery.StatusCode != http.StatusOK {
		t.Fatalf("Failed to query created order: %v", err)
	}

	// 3. Complete Payment Simulation
	payPayload, _ := json.Marshal(map[string]string{
		"payment_reference": "QRIS-SIM-" + orderNumber,
	})
	reqPay := httptest.NewRequest(http.MethodPost, "/api/v1/commerce/orders/"+orderID+"/pay", bytes.NewReader(payPayload))
	reqPay.Header.Set("Content-Type", "application/json")
	respPay, err := app.Test(reqPay)
	if err != nil {
		t.Fatalf("Order pay request failed: %v", err)
	}
	if respPay.StatusCode != http.StatusOK {
		t.Errorf("Expected 200 OK on payment confirmation, got %d", respPay.StatusCode)
	}

	var payResp map[string]interface{}
	_ = json.NewDecoder(respPay.Body).Decode(&payResp)
	if payResp["status"] != "PAID" {
		t.Errorf("Expected order status 'PAID', got %v", payResp["status"])
	}
}

func TestE2EPOSRetailJourneyAndIdempotency(t *testing.T) {
	_, db, app, cleanup := initTestEnv(t)
	defer cleanup()

	// Fetch product IDs
	var prodID string
	err := db.Pool.QueryRow(context.Background(), "SELECT id FROM catalog.products WHERE sku = 'BF-BLU-DUK-125G'").Scan(&prodID)
	if err != nil {
		t.Fatalf("Failed to fetch product for POS: %v", err)
	}

	receiptNumber := fmt.Sprintf("POS-E2E-%d", time.Now().UnixNano())

	salePayload := map[string]interface{}{
		"receipt_number": receiptNumber,
		"cashier_id":     "00000000-0000-0000-0000-000000000002",
		"payment_method": "CASH",
		"cash_tendered":  100000,
		"items": []map[string]interface{}{
			{
				"product_id": prodID,
				"quantity":   1,
				"unit_price": 52000,
			},
		},
	}
	payloadBytes, _ := json.Marshal(salePayload)

	// 1. First Checkout (Live sale)
	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/retail/sales/checkout", bytes.NewReader(payloadBytes))
	req1.Header.Set("Content-Type", "application/json")
	resp1, err := app.Test(req1)
	if err != nil {
		t.Fatalf("POS checkout 1 failed: %v", err)
	}
	if resp1.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp1.Body)
		t.Fatalf("Expected 200 OK on POS sale 1, got %d: %s", resp1.StatusCode, string(body))
	}

	var sale1Resp map[string]interface{}
	_ = json.NewDecoder(resp1.Body).Decode(&sale1Resp)
	sale1Data, _ := sale1Resp["data"].(map[string]interface{})
	if sale1Data["receipt_number"] != receiptNumber {
		t.Errorf("Expected receipt_number %s, got %v", receiptNumber, sale1Data["receipt_number"])
	}

	// 2. Second Checkout with SAME receipt_number (Offline Replay / Idempotency Test)
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/retail/sales/checkout", bytes.NewReader(payloadBytes))
	req2.Header.Set("Content-Type", "application/json")
	resp2, err := app.Test(req2)
	if err != nil {
		t.Fatalf("POS checkout 2 failed: %v", err)
	}
	if resp2.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200 OK on idempotent retry, got %d", resp2.StatusCode)
	}

	var sale2Resp map[string]interface{}
	_ = json.NewDecoder(resp2.Body).Decode(&sale2Resp)
	sale2Data, _ := sale2Resp["data"].(map[string]interface{})
	if sale2Data["receipt_number"] != receiptNumber {
		t.Errorf("Expected idempotent receipt_number %s, got %v", receiptNumber, sale2Data["receipt_number"])
	}

	// 3. Get Current Shift and Shift History
	reqShift := httptest.NewRequest(http.MethodGet, "/api/v1/retail/shifts/current", nil)
	respShift, _ := app.Test(reqShift)
	if respShift.StatusCode != http.StatusOK {
		t.Errorf("Expected 200 OK on current shift query, got %d", respShift.StatusCode)
	}

	reqHist := httptest.NewRequest(http.MethodGet, "/api/v1/retail/shifts/history", nil)
	respHist, _ := app.Test(reqHist)
	if respHist.StatusCode != http.StatusOK {
		t.Errorf("Expected 200 OK on shift history query, got %d", respHist.StatusCode)
	}
}

func TestE2EInventoryBatchesAndStudioOverview(t *testing.T) {
	_, db, app, cleanup := initTestEnv(t)
	defer cleanup()

	// 1. FEFO Batches View
	reqBatches := httptest.NewRequest(http.MethodGet, "/api/v1/inventory/batches", nil)
	respBatches, err := app.Test(reqBatches)
	if err != nil || respBatches.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200 OK on batches query, got %v", err)
	}

	var batchData map[string]interface{}
	_ = json.NewDecoder(respBatches.Body).Decode(&batchData)
	batches, ok := batchData["data"].([]interface{})
	if !ok || len(batches) == 0 {
		t.Fatalf("Expected non-empty FEFO batches list")
	}

	// Verify FEFO order flag is present
	firstBatch := batches[0].(map[string]interface{})
	if firstBatch["fefo_order"] == nil || firstBatch["hours_remaining"] == nil {
		t.Errorf("Batch missing FEFO metadata: %v", firstBatch)
	}

	// 2. Warehouse & Store Balances View
	reqBalances := httptest.NewRequest(http.MethodGet, "/api/v1/inventory/balances", nil)
	respBalances, err := app.Test(reqBalances)
	if err != nil || respBalances.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200 OK on balances query, got %v", err)
	}

	// 3. Stock Adjustment Write-off
	var batchID, facilityID, prodID string
	err = db.Pool.QueryRow(context.Background(), `
		SELECT b.id, b.batch_id, b.facility_id
		FROM inventory.stock_balances b
		WHERE b.quantity_on_hand > 5
		LIMIT 1
	`).Scan(&prodID, &batchID, &facilityID)
	if err == nil {
		adjPayload := map[string]interface{}{
			"batch_id":            batchID,
			"facility_id":         facilityID,
			"quantity_delta":      -1.0,
			"reason_code":         "MOISTURE_LOSS",
			"notes":               "Automated E2E shrinkage test adjustment",
			"adjusted_by_user_id": "00000000-0000-0000-0000-000000000001",
		}
		adjBytes, _ := json.Marshal(adjPayload)
		reqAdj := httptest.NewRequest(http.MethodPost, "/api/v1/inventory/adjustments", bytes.NewReader(adjBytes))
		reqAdj.Header.Set("Content-Type", "application/json")
		respAdj, _ := app.Test(reqAdj)
		if respAdj.StatusCode != http.StatusCreated {
			t.Errorf("Expected 201 Created on inventory adjustment, got %d", respAdj.StatusCode)
		}
	}

	// 4. Studio Overview Telemetry
	reqOverview := httptest.NewRequest(http.MethodGet, "/api/v1/analytics/overview", nil)
	respOverview, err := app.Test(reqOverview)
	if err != nil || respOverview.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200 OK on analytics overview, got %v", err)
	}

	var overview map[string]interface{}
	_ = json.NewDecoder(respOverview.Body).Decode(&overview)
	data, ok := overview["data"].(map[string]interface{})
	if !ok || data["active_batches_count"] == nil || data["gross_sales_today_cents"] == nil {
		t.Errorf("Analytics overview missing required metrics: %v", overview)
	}
}

func TestE2E_OrderLifecycle_Cancel_Fulfillment_Refund(t *testing.T) {
	_, db, app, cleanup := initTestEnv(t)
	defer cleanup()

	// 1. Create Order A to test CANCELLATION before payment
	orderPayload := map[string]interface{}{
		"customer_name":    "Budi Santoso",
		"customer_email":   "budi@example.com",
		"customer_phone":   "081299887766",
		"delivery_address": "Jl. Senopati No. 45, Jakarta Selatan",
		"payment_method":   "QRIS",
		"items": []map[string]interface{}{
			{
				"product_id": "10000000-0000-0000-0000-000000000001",
				"quantity":   2,
			},
		},
	}
	bodyBytes, _ := json.Marshal(orderPayload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/commerce/orders/checkout", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil || resp.StatusCode != http.StatusCreated {
		t.Fatalf("Failed to create order A: %v (status: %d)", err, resp.StatusCode)
	}

	var checkoutRes map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&checkoutRes)
	orderData := checkoutRes["data"].(map[string]interface{})
	orderID := orderData["order_id"].(string)
	orderNum := orderData["order_number"].(string)

	// Verify order status is PENDING_PAYMENT
	if orderData["status"] != "PENDING_PAYMENT" {
		t.Fatalf("Expected status PENDING_PAYMENT, got %v", orderData["status"])
	}

	// 2. Cancel Order A (Customer Cancels before payment)
	cancelPayload := map[string]interface{}{
		"reason": "Salah pilih varietas buah",
	}
	cancelBytes, _ := json.Marshal(cancelPayload)
	reqCancel := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/commerce/orders/%s/cancel", orderID), bytes.NewReader(cancelBytes))
	reqCancel.Header.Set("Content-Type", "application/json")
	respCancel, err := app.Test(reqCancel)
	if err != nil || respCancel.StatusCode != http.StatusOK {
		t.Fatalf("Failed to cancel order: %v (status: %d)", err, respCancel.StatusCode)
	}

	var cancelRes map[string]interface{}
	_ = json.NewDecoder(respCancel.Body).Decode(&cancelRes)
	if cancelRes["status"] != "CANCELLED" {
		t.Errorf("Expected status CANCELLED, got %v", cancelRes["status"])
	}

	// Verify reservations for order A are marked RELEASED in database
	var activeResCount int
	_ = db.Pool.QueryRow(context.Background(), `
		SELECT count(*) FROM inventory.stock_reservations WHERE reference_id = $1 AND status = 'ACTIVE'
	`, orderNum).Scan(&activeResCount)
	if activeResCount != 0 {
		t.Errorf("Expected 0 active reservations after cancellation, got %d", activeResCount)
	}

	// 3. Create Order B to test PAYMENT -> FULFILLMENT -> REFUND
	bodyBytesB, _ := json.Marshal(orderPayload)
	reqB := httptest.NewRequest(http.MethodPost, "/api/v1/commerce/orders/checkout", bytes.NewReader(bodyBytesB))
	reqB.Header.Set("Content-Type", "application/json")
	respB, _ := app.Test(reqB)
	var checkoutResB map[string]interface{}
	_ = json.NewDecoder(respB.Body).Decode(&checkoutResB)
	orderDataB := checkoutResB["data"].(map[string]interface{})
	orderIDB := orderDataB["order_id"].(string)

	// Pay Order B
	reqPay := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/commerce/orders/%s/pay", orderIDB), nil)
	respPay, _ := app.Test(reqPay)
	if respPay.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200 OK on pay order B, got %d", respPay.StatusCode)
	}

	// 4. Update Fulfillment: PACKING -> IN_TRANSIT -> DELIVERED
	fulfillmentSteps := []string{"PACKING", "IN_TRANSIT", "DELIVERED"}
	for _, step := range fulfillmentSteps {
		fPayload := map[string]interface{}{
			"status": step,
			"notes":  fmt.Sprintf("Cold-chain stage: %s", step),
		}
		fBytes, _ := json.Marshal(fPayload)
		reqF := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/v1/commerce/orders/%s/fulfillment", orderIDB), bytes.NewReader(fBytes))
		reqF.Header.Set("Content-Type", "application/json")
		respF, err := app.Test(reqF)
		if err != nil || respF.StatusCode != http.StatusOK {
			t.Fatalf("Failed to transition fulfillment to %s: status %d", step, respF.StatusCode)
		}
	}

	// 5. Refund Order B with restock: true
	refundPayload := map[string]interface{}{
		"reason":  "Pengembalian dana pelanggan disetujui",
		"restock": true,
	}
	refundBytes, _ := json.Marshal(refundPayload)
	reqRefund := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/commerce/orders/%s/refund", orderIDB), bytes.NewReader(refundBytes))
	reqRefund.Header.Set("Content-Type", "application/json")
	respRefund, err := app.Test(reqRefund)
	if err != nil || respRefund.StatusCode != http.StatusOK {
		t.Fatalf("Failed to refund order B: status %d", respRefund.StatusCode)
	}

	var refundRes map[string]interface{}
	_ = json.NewDecoder(respRefund.Body).Decode(&refundRes)
	if refundRes["status"] != "REFUNDED" {
		t.Errorf("Expected status REFUNDED, got %v", refundRes["status"])
	}

	// 6. Test GET /api/v1/commerce/orders listing
	reqList := httptest.NewRequest(http.MethodGet, "/api/v1/commerce/orders?status=ALL", nil)
	respList, err := app.Test(reqList)
	if err != nil || respList.StatusCode != http.StatusOK {
		t.Fatalf("Failed to get orders list: status %d", respList.StatusCode)
	}
	var listRes map[string]interface{}
	_ = json.NewDecoder(respList.Body).Decode(&listRes)
	orders, ok := listRes["data"].([]interface{})
	if !ok || len(orders) == 0 {
		t.Errorf("Expected list of orders to contain entries, got %v", listRes)
	}
}
