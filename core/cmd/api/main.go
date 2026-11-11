package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"berryfresh/core/internal/config"
	"berryfresh/core/internal/database"
	"berryfresh/core/internal/middleware"
	"berryfresh/core/internal/modules/catalog"
	"berryfresh/core/internal/modules/commerce"
	"berryfresh/core/internal/modules/identity"
	"berryfresh/core/internal/modules/inventory"
	"berryfresh/core/internal/modules/retail"
	"berryfresh/core/internal/outbox"

	"github.com/gofiber/fiber/v3"
)

func main() {
	cfg := config.LoadConfig()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Connect PostgreSQL (Neon)
	db, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Printf("[Main] Warning: DB error: %v", err)
	}
	defer db.Close()

	// Initialize Transactional Outbox
	var outboxPool = db.Pool
	outboxSvc := outbox.NewOutboxService(outboxPool)
	outboxSvc.StartWorker(ctx, 3*time.Second)

	// Fiber v3 Application
	app := fiber.New(fiber.Config{
		AppName:      cfg.AppName,
		ServerHeader: "Berry-Fresh-Core/1.0",
	})

	// Global Middlewares
	app.Use(middleware.NewCORS(cfg.CORSAllowOrigins))

	// Health Check
	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":            "healthy",
			"app_name":          cfg.AppName,
			"environment":       cfg.AppEnv,
			"database_ready":    db.IsConnected(),
			"outbox_active":     true,
			"timestamp":         time.Now().Format(time.RFC3339),
			"version":           "1.0.0",
		})
	})

	// Domain Handlers
	authHandler := identity.NewAuthHandler(cfg, db)
	catalogHandler := catalog.NewCatalogHandler(db)
	inventoryHandler := inventory.NewInventoryHandler(db, outboxSvc)
	retailHandler := retail.NewRetailHandler(db, outboxSvc)
	commerceHandler := commerce.NewCommerceHandler(db, outboxSvc)

	// API v1 Routing
	api := app.Group("/api/v1")

	// 1. Identity & Auth Routes
	auth := api.Group("/auth")
	auth.Post("/login", authHandler.Login)
	auth.Get("/me", middleware.RequireAuth(cfg.JWTAccessSecret), authHandler.Me)

	// 2. Master Catalog Routes
	cat := api.Group("/catalog")
	cat.Get("/products", catalogHandler.GetProducts)
	cat.Get("/products/:id", catalogHandler.GetProductByID)
	cat.Get("/plu-quick-keys", catalogHandler.GetPLUQuickKeys)

	// 3. Inventory & Batches (FEFO)
	inv := api.Group("/inventory")
	inv.Get("/batches", inventoryHandler.GetBatches)
	inv.Post("/adjustments", inventoryHandler.RecordAdjustment)

	// 4. Retail POS Routes
	ret := api.Group("/retail")
	ret.Get("/shifts/current", retailHandler.GetCurrentShift)
	ret.Post("/shifts/open", retailHandler.OpenShift)
	ret.Post("/shifts/close", retailHandler.CloseShift)
	ret.Post("/sales/checkout", retailHandler.CheckoutSale)
	ret.Get("/sales/qris/generate", retailHandler.GenerateDynamicQRIS)

	// 5. Commerce E-Commerce Routes
	comm := api.Group("/commerce")
	comm.Post("/orders/checkout", commerceHandler.CheckoutOrder)
	comm.Post("/orders/:id/pay", commerceHandler.PayOrder)

	// Graceful Shutdown
	go func() {
		addr := fmt.Sprintf(":%s", cfg.AppPort)
		log.Printf("🍓 Berry Fresh Core API starting on http://localhost%s", addr)
		if err := app.Listen(addr); err != nil {
			log.Fatalf("Server shutdown error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("[Shutdown] Gracefully terminating Berry Fresh Core...")
	_ = app.Shutdown()
	cancel()
}
