package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RunMigrations discovers and applies all *.up.sql files sequentially.
func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	if pool == nil {
		return fmt.Errorf("cannot run migrations on nil connection pool")
	}

	// 1. Ensure schema_migrations table exists in public schema
	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS public.schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMPTZ DEFAULT NOW()
		);
	`)
	if err != nil {
		return fmt.Errorf("failed to create schema_migrations table: %w", err)
	}

	// 2. Locate migrations directory
	migrationsDir := findMigrationsDir()
	if migrationsDir == "" {
		log.Println("[Migrations] Notice: migrations directory not found, skipping migration check")
		return nil
	}

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to read migrations dir: %w", err)
	}

	var upFiles []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".up.sql") {
			upFiles = append(upFiles, entry.Name())
		}
	}
	sort.Strings(upFiles)

	for _, file := range upFiles {
		var alreadyApplied bool
		err := pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM public.schema_migrations WHERE version = $1)", file).Scan(&alreadyApplied)
		if err != nil {
			return fmt.Errorf("error checking migration %s: %w", file, err)
		}

		if alreadyApplied {
			continue
		}

		content, err := os.ReadFile(filepath.Join(migrationsDir, file))
		if err != nil {
			return fmt.Errorf("error reading migration %s: %w", file, err)
		}

		log.Printf("[Migrations] Applying %s...", file)
		tx, err := pool.Begin(ctx)
		if err != nil {
			return fmt.Errorf("failed to begin tx for %s: %w", file, err)
		}

		if _, err := tx.Exec(ctx, string(content)); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("failed to execute migration %s: %w", file, err)
		}

		if _, err := tx.Exec(ctx, "INSERT INTO public.schema_migrations (version) VALUES ($1)", file); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("failed to record migration %s: %w", file, err)
		}

		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit migration %s: %w", file, err)
		}

		log.Printf("[Migrations] Successfully applied %s", file)
	}

	return nil
}

func findMigrationsDir() string {
	candidates := []string{
		os.Getenv("MIGRATIONS_DIR"),
		"migrations",
		"./migrations",
		"../migrations",
		"../../migrations",
		"core/migrations",
		"D:/All Coding/05 - Applications/Web Applications/Berry Fresh Ecosystem/core/migrations",
	}

	for _, c := range candidates {
		if c == "" {
			continue
		}
		if info, err := os.Stat(c); err == nil && info.IsDir() {
			return c
		}
	}
	return ""
}
