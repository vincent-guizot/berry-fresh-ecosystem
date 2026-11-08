package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"berryfresh/core/internal/config"
	"berryfresh/core/internal/database"
	"berryfresh/core/internal/outbox"
)

func main() {
	cfg := config.LoadConfig()
	log.Printf("[Worker] Starting Berry Fresh Event Relay & Outbox Consumer...")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	db, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Printf("[Worker] Warning: DB error: %v", err)
	}
	defer db.Close()

	outboxSvc := outbox.NewOutboxService(db.Pool)
	outboxSvc.StartWorker(ctx, 2*time.Second)

	log.Printf("[Worker] Listening to RabbitMQ events and relaying outbox messages...")

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("[Worker] Shutting down worker gracefully...")
}
