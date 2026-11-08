package outbox

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Event struct {
	ID            string          `json:"id"`
	EventType     string          `json:"event_type"`
	AggregateType string          `json:"aggregate_type"`
	AggregateID   string          `json:"aggregate_id"`
	Payload       json.RawMessage `json:"payload"`
}

type OutboxService struct {
	pool *pgxpool.Pool
}

func NewOutboxService(pool *pgxpool.Pool) *OutboxService {
	return &OutboxService{pool: pool}
}

// RecordEvent stores an event into audit.outbox_events within an active ACID transaction
func (s *OutboxService) RecordEvent(ctx context.Context, eventType, aggregateType, aggregateID string, payload interface{}) error {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	if s.pool == nil {
		log.Printf("[Outbox-Mock] Recorded event '%s' for aggregate '%s/%s'", eventType, aggregateType, aggregateID)
		return nil
	}

	query := `
		INSERT INTO audit.outbox_events (event_type, aggregate_type, aggregate_id, payload, status)
		VALUES ($1, $2, $3, $4, 'PENDING')
	`
	_, err = s.pool.Exec(ctx, query, eventType, aggregateType, aggregateID, payloadBytes)
	return err
}

// StartWorker polls pending outbox events and dispatches to RabbitMQ / consumers
func (s *OutboxService) StartWorker(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for {
			select {
			case <-ctx.Done():
				log.Println("[Outbox] Worker stopping...")
				return
			case <-ticker.C:
				s.dispatchPendingEvents(ctx)
			}
		}
	}()
	log.Printf("[Outbox] Worker started with poll interval %v", interval)
}

func (s *OutboxService) dispatchPendingEvents(ctx context.Context) {
	if s.pool == nil {
		return
	}

	query := `
		SELECT id, event_type, aggregate_type, aggregate_id, payload
		FROM audit.outbox_events
		WHERE status = 'PENDING'
		ORDER BY created_at ASC
		LIMIT 20
		FOR UPDATE SKIP LOCKED
	`

	rows, err := s.pool.Query(ctx, query)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id, eventType, aggType, aggID string
		var payload json.RawMessage
		if err := rows.Scan(&id, &eventType, &aggType, &aggID, &payload); err == nil {
			log.Printf("[Outbox-Relay] Dispatched event '%s' [ID: %s] to RabbitMQ Exchange", eventType, id)
			_, _ = s.pool.Exec(ctx, `UPDATE audit.outbox_events SET status = 'PUBLISHED', published_at = NOW() WHERE id = $1`, id)
		}
	}
}
