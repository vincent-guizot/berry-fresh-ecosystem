package database

import (
	"context"
	"os"
	"testing"
	"time"
)

func TestPostgreSQLDatabaseIntegration(t *testing.T) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:admin@localhost:1000/berryfresh_db?sslmode=disable"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	db, err := Connect(ctx, dbURL)
	if err != nil || !db.IsConnected() {
		t.Skip("PostgreSQL not available, skipping integration test")
		return
	}
	defer db.Close()

	// 1. Verify schema tables and seed data
	var userCount, prodCount, batchCount int
	err = db.Pool.QueryRow(ctx, "SELECT count(*) FROM identity.users").Scan(&userCount)
	if err != nil || userCount == 0 {
		t.Errorf("Expected seeded users in database, got count=%d, err=%v", userCount, err)
	}

	err = db.Pool.QueryRow(ctx, "SELECT count(*) FROM catalog.products").Scan(&prodCount)
	if err != nil || prodCount == 0 {
		t.Errorf("Expected seeded products in database, got count=%d, err=%v", prodCount, err)
	}

	err = db.Pool.QueryRow(ctx, "SELECT count(*) FROM traceability.batches").Scan(&batchCount)
	if err != nil || batchCount == 0 {
		t.Errorf("Expected seeded batches in database, got count=%d, err=%v", batchCount, err)
	}

	// 2. Test ACID Transaction with Rollback
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		t.Fatalf("Failed to begin transaction: %v", err)
	}

	testOrderNum := "BF-TEST-ORD-001"
	_, err = tx.Exec(ctx, `
		INSERT INTO audit.outbox_events (event_type, aggregate_type, aggregate_id, payload, status)
		VALUES ('test.event', 'test', $1, '{"test":true}', 'PENDING')
	`, testOrderNum)
	if err != nil {
		t.Fatalf("Failed to insert outbox event in tx: %v", err)
	}

	// Rollback transaction to leave database clean
	if err := tx.Rollback(ctx); err != nil {
		t.Fatalf("Failed to rollback tx: %v", err)
	}

	// Verify rollback succeeded
	var exists bool
	_ = db.Pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM audit.outbox_events WHERE aggregate_id = $1)", testOrderNum).Scan(&exists)
	if exists {
		t.Errorf("Expected rollback to prevent persistence of test outbox event")
	}
}
