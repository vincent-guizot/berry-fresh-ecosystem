package commerce

import (
	"context"
	"log"
	"time"

	"berryfresh/core/internal/database"
	"berryfresh/core/internal/outbox"
)

// ReservationSweeper scans for expired stock reservations, releases the held stock,
// and marks unpaid orders as CANCELLED.
type ReservationSweeper struct {
	db     *database.Database
	outbox *outbox.OutboxService
}

func NewReservationSweeper(db *database.Database, outbox *outbox.OutboxService) *ReservationSweeper {
	return &ReservationSweeper{db: db, outbox: outbox}
}

// Start launches a periodic background goroutine to sweep expired reservations.
func (s *ReservationSweeper) Start(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				s.SweepExpiredReservations(ctx)
			}
		}
	}()
	log.Printf("[Sweeper] FEFO Stock Reservation Sweeper running (interval: %v)", interval)
}

// SweepExpiredReservations finds active reservations where expires_at < NOW(),
// decrements quantity_reserved_base, marks reservation as RELEASED, and cancels unpaid orders.
func (s *ReservationSweeper) SweepExpiredReservations(ctx context.Context) int {
	if s.db == nil || s.db.Pool == nil {
		return 0
	}

	sweepCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	tx, err := s.db.Pool.Begin(sweepCtx)
	if err != nil {
		return 0
	}
	defer tx.Rollback(sweepCtx)

	rows, err := tx.Query(sweepCtx, `
		SELECT sr.id::text, sr.stock_balance_id::text, sr.reference_id, sr.quantity_reserved_base
		FROM inventory.stock_reservations sr
		WHERE sr.status = 'ACTIVE' AND sr.expires_at < NOW()
		FOR UPDATE OF sr
	`)
	if err != nil {
		return 0
	}

	type ExpiredReservation struct {
		id, balanceID, orderNumber string
		quantity                   float64
	}
	var expiredList []ExpiredReservation
	for rows.Next() {
		var item ExpiredReservation
		if err := rows.Scan(&item.id, &item.balanceID, &item.orderNumber, &item.quantity); err == nil {
			expiredList = append(expiredList, item)
		}
	}
	rows.Close()

	if len(expiredList) == 0 {
		return 0
	}

	for _, item := range expiredList {
		// 1. Release reserved balance from stock_balances
		_, _ = tx.Exec(sweepCtx, `
			UPDATE inventory.stock_balances
			SET quantity_reserved_base = GREATEST(0, quantity_reserved_base - $1), updated_at = NOW()
			WHERE id::text = $2
		`, item.quantity, item.balanceID)

		// 2. Mark reservation as RELEASED
		_, _ = tx.Exec(sweepCtx, `
			UPDATE inventory.stock_reservations
			SET status = 'RELEASED'
			WHERE id::text = $1
		`, item.id)

		// 3. Mark associated order as CANCELLED if still PENDING_PAYMENT
		_, _ = tx.Exec(sweepCtx, `
			UPDATE commerce.orders
			SET status = 'CANCELLED', refund_reason = 'Waktu pembayaran kadaluwarsa (30 menit)', updated_at = NOW()
			WHERE order_number = $1 AND status = 'PENDING_PAYMENT'
		`, item.orderNumber)

		// 4. Record outbox event
		if s.outbox != nil {
			_ = s.outbox.RecordEvent(sweepCtx, "order.expired", "order", item.orderNumber, map[string]interface{}{
				"order_number": item.orderNumber,
				"reason":       "Reservation expired after timeout",
				"quantity":     item.quantity,
				"status":       "CANCELLED",
			})
		}
	}

	if err := tx.Commit(sweepCtx); err != nil {
		return 0
	}

	log.Printf("[Sweeper] Swept and released %d expired FEFO stock reservations", len(expiredList))
	return len(expiredList)
}
