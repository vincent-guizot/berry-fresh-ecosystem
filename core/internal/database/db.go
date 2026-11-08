package database

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Database struct {
	Pool *pgxpool.Pool
}

func Connect(ctx context.Context, databaseURL string) (*Database, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}

	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnIdleTime = 15 * time.Minute

	poolCtx, cancel := context.WithTimeout(ctx, 4*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(poolCtx, config)
	if err != nil {
		log.Printf("[Database] Notice: PostgreSQL connection could not be established (%v). Running with mock readiness.", err)
		return &Database{Pool: nil}, nil
	}

	if err := pool.Ping(poolCtx); err != nil {
		log.Printf("[Database] Notice: PostgreSQL ping timed out (%v). Running with mock readiness.", err)
		return &Database{Pool: nil}, nil
	}

	log.Println("[Database] Successfully connected to PostgreSQL (Neon)")
	return &Database{Pool: pool}, nil
}

func (d *Database) IsConnected() bool {
	return d.Pool != nil
}

func (d *Database) Close() {
	if d.Pool != nil {
		d.Pool.Close()
	}
}
