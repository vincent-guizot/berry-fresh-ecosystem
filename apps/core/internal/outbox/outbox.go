package outbox

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	amqp "github.com/rabbitmq/amqp091-go"
)

type Event struct {
	ID            string          `json:"id"`
	EventType     string          `json:"event_type"`
	AggregateType string          `json:"aggregate_type"`
	AggregateID   string          `json:"aggregate_id"`
	Payload       json.RawMessage `json:"payload"`
}

type OutboxService struct {
	pool        *pgxpool.Pool
	rabbitmqURL string
	exchange    string
	amqpConn    *amqp.Connection
	amqpChan    *amqp.Channel
	mu          sync.Mutex
}

func NewOutboxService(pool *pgxpool.Pool, rabbitmqURL, exchange string) *OutboxService {
	svc := &OutboxService{
		pool:        pool,
		rabbitmqURL: rabbitmqURL,
		exchange:    exchange,
	}
	svc.tryConnectRabbitMQ()
	return svc
}

func (s *OutboxService) tryConnectRabbitMQ() {
	if s.rabbitmqURL == "" {
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	conn, err := amqp.Dial(s.rabbitmqURL)
	if err != nil {
		log.Printf("[Outbox] RabbitMQ connection notice (%v). Events will be queued in PostgreSQL outbox.", err)
		return
	}

	ch, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		log.Printf("[Outbox] RabbitMQ channel error: %v", err)
		return
	}

	// Declare durable topic exchange
	err = ch.ExchangeDeclare(
		s.exchange,
		"topic",
		true,  // durable
		false, // auto-deleted
		false, // internal
		false, // no-wait
		nil,
	)
	if err != nil {
		_ = ch.Close()
		_ = conn.Close()
		log.Printf("[Outbox] ExchangeDeclare error: %v", err)
		return
	}

	s.amqpConn = conn
	s.amqpChan = ch
	log.Printf("[Outbox] Successfully connected to RabbitMQ Exchange '%s'", s.exchange)
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
				s.Close()
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

	// Reconnect AMQP if lost
	if s.amqpChan == nil || s.amqpConn == nil || s.amqpConn.IsClosed() {
		s.tryConnectRabbitMQ()
	}

	query := `
		SELECT id, event_type, aggregate_type, aggregate_id, payload, retry_count, max_retries
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

	type PendingItem struct {
		id, eventType, aggType, aggID string
		payload                       json.RawMessage
		retryCount, maxRetries        int
	}

	var items []PendingItem
	for rows.Next() {
		var it PendingItem
		if err := rows.Scan(&it.id, &it.eventType, &it.aggType, &it.aggID, &it.payload, &it.retryCount, &it.maxRetries); err == nil {
			items = append(items, it)
		}
	}

	for _, item := range items {
		var publishErr error
		if s.amqpChan != nil {
			publishErr = s.amqpChan.PublishWithContext(
				ctx,
				s.exchange,
				item.eventType, // Routing key
				false,          // mandatory
				false,          // immediate
				amqp.Publishing{
					ContentType:  "application/json",
					DeliveryMode: amqp.Persistent,
					MessageId:    item.id,
					Timestamp:    time.Now(),
					Type:         item.eventType,
					Body:         item.payload,
				},
			)
		}

		if publishErr == nil {
			log.Printf("[Outbox-Relay] Dispatched event '%s' [ID: %s] successfully", item.eventType, item.id)
			_, _ = s.pool.Exec(ctx, `
				UPDATE audit.outbox_events 
				SET status = 'PUBLISHED', published_at = NOW() 
				WHERE id = $1
			`, item.id)
		} else {
			log.Printf("[Outbox-Relay] Failed dispatch for event '%s': %v", item.eventType, publishErr)
			if item.retryCount+1 >= item.maxRetries {
				_, _ = s.pool.Exec(ctx, `
					UPDATE audit.outbox_events 
					SET status = 'DEAD_LETTER', error_message = $1, retry_count = retry_count + 1 
					WHERE id = $2
				`, publishErr.Error(), item.id)
			} else {
				_, _ = s.pool.Exec(ctx, `
					UPDATE audit.outbox_events 
					SET retry_count = retry_count + 1, error_message = $1 
					WHERE id = $2
				`, publishErr.Error(), item.id)
			}
		}
	}
}

// RecordInboxProcess records message in audit.inbox_events for deduplication
func (s *OutboxService) RecordInboxProcess(ctx context.Context, messageID, eventType, consumerName string) (bool, error) {
	if s.pool == nil {
		return true, nil
	}

	var alreadyProcessed bool
	err := s.pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM audit.inbox_events WHERE message_id = $1)", messageID).Scan(&alreadyProcessed)
	if err != nil {
		return false, err
	}
	if alreadyProcessed {
		return false, nil // duplicate ignored
	}

	_, err = s.pool.Exec(ctx, `
		INSERT INTO audit.inbox_events (message_id, event_type, consumer_name, processed_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (message_id) DO NOTHING
	`, messageID, eventType, consumerName)

	return true, err
}

func (s *OutboxService) Close() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.amqpChan != nil {
		_ = s.amqpChan.Close()
	}
	if s.amqpConn != nil {
		_ = s.amqpConn.Close()
	}
}
