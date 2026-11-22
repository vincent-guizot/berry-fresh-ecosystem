package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"berryfresh/core/internal/config"
	"berryfresh/core/internal/database"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg := config.LoadConfig()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = cfg.DatabaseURL
	}
	if dbURL == "" {
		dbURL = "postgres://postgres:admin@localhost:5432/berryfresh_db?sslmode=disable"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	log.Println("==========================================================")
	log.Println("🍓 BERRY FRESH — DATABASE SETUP, MIGRATION & JSON SEEDER")
	log.Println("==========================================================")

	// 1. Ensure database exists
	ensureDatabaseExists(ctx, dbURL)

	// 2. Connect to target database
	poolConfig, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatalf("❌ Failed to parse database URL: %v", err)
	}

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer pool.Close()

	// 3. Run Migrations
	log.Println("\n📦 [1/3] Running database schema migrations (000001 - 000007)...")
	if err := database.RunMigrations(ctx, pool); err != nil {
		log.Fatalf("❌ Migration failed: %v", err)
	}
	log.Println("✅ Schema migrations applied successfully.")

	// 4. Seed from JSON files
	log.Println("\n🌱 [2/3] Seeding database tables from JSON seed files...")
	seedsDir := findSeedsDir()
	log.Printf("📂 Reading JSON seed files from: %s\n", seedsDir)

	seedTablesFromJSON(ctx, pool, seedsDir)

	// 5. Verification count
	log.Println("\n📊 [3/3] Verifying table record counts:")
	tables := []struct {
		schema string
		table  string
	}{
		{"governance", "organizations"},
		{"governance", "facilities"},
		{"governance", "stores"},
		{"retail", "cash_registers"},
		{"identity", "users"},
		{"catalog", "categories"},
		{"catalog", "units_of_measure"},
		{"catalog", "varieties"},
		{"catalog", "products"},
		{"catalog", "product_prices"},
		{"procurement", "suppliers"},
		{"production", "farms"},
		{"traceability", "batches"},
		{"inventory", "stock_balances"},
		{"retail", "cashier_shifts"},
	}

	for _, t := range tables {
		var cnt int
		_ = pool.QueryRow(ctx, fmt.Sprintf("SELECT count(*) FROM %s.%s", t.schema, t.table)).Scan(&cnt)
		log.Printf("  • %s.%s: %d records", t.schema, t.table, cnt)
	}

	log.Println("\n🎉 Database setup, migration, and JSON seeding completed successfully!")
}

func ensureDatabaseExists(ctx context.Context, targetURL string) {
	connCtx, connCancel := context.WithTimeout(ctx, 3*time.Second)
	defer connCancel()

	conn, err := pgx.Connect(connCtx, targetURL)
	if err == nil {
		conn.Close(ctx)
		log.Println("✅ Target database is reachable.")
		return
	}

	parsed, err := url.Parse(targetURL)
	if err != nil {
		return
	}
	targetDB := strings.TrimPrefix(parsed.Path, "/")
	if targetDB == "" {
		targetDB = "berryfresh_db"
	}

	parsed.Path = "/postgres"
	defaultURL := parsed.String()

	pCtx, pCancel := context.WithTimeout(ctx, 3*time.Second)
	defer pCancel()

	pConn, err := pgx.Connect(pCtx, defaultURL)
	if err != nil {
		log.Printf("⚠️ Notice: %v", err)
		return
	}
	defer pConn.Close(ctx)

	log.Printf("🛠 Creating database '%s'...", targetDB)
	_, _ = pConn.Exec(ctx, fmt.Sprintf("CREATE DATABASE %s", targetDB))
	log.Printf("✅ Database '%s' created.", targetDB)
}

func findSeedsDir() string {
	candidates := []string{
		"seeds",
		"core/seeds",
		"../seeds",
		"../../seeds",
	}
	for _, c := range candidates {
		if fi, err := os.Stat(c); err == nil && fi.IsDir() {
			abs, _ := filepath.Abs(c)
			return abs
		}
	}
	return "core/seeds"
}

func seedTablesFromJSON(ctx context.Context, pool *pgxpool.Pool, seedsDir string) {
	// 1. Organizations
	var orgs []struct {
		ID       string `json:"id"`
		Code     string `json:"code"`
		Name     string `json:"name"`
		TaxID    string `json:"tax_id"`
		Currency string `json:"currency"`
	}
	if loadJSON(seedsDir, "01_organizations.json", &orgs) {
		for _, o := range orgs {
			_, _ = pool.Exec(ctx, `
				INSERT INTO governance.organizations (id, code, name, tax_id, currency)
				VALUES ($1, $2, $3, $4, $5)
				ON CONFLICT (code) DO NOTHING
			`, o.ID, o.Code, o.Name, o.TaxID, o.Currency)
		}
		log.Printf("  ✓ 01_organizations.json: %d seeded", len(orgs))
	}

	// 2. Facilities
	var facs []struct {
		ID           string `json:"id"`
		OrgID        string `json:"organization_id"`
		Code         string `json:"code"`
		Name         string `json:"name"`
		FacilityType string `json:"facility_type"`
		Address      string `json:"address"`
		City         string `json:"city"`
		Province     string `json:"province"`
		PostalCode   string `json:"postal_code"`
	}
	if loadJSON(seedsDir, "02_facilities.json", &facs) {
		for _, f := range facs {
			_, _ = pool.Exec(ctx, `
				INSERT INTO governance.facilities (id, organization_id, code, name, facility_type, address, city, province, postal_code)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
				ON CONFLICT (code) DO NOTHING
			`, f.ID, f.OrgID, f.Code, f.Name, f.FacilityType, f.Address, f.City, f.Province, f.PostalCode)
		}
		log.Printf("  ✓ 02_facilities.json: %d seeded", len(facs))
	}

	// 3. Stores
	var stores []struct {
		ID      string `json:"id"`
		OrgID   string `json:"organization_id"`
		FacID   string `json:"facility_id"`
		Code    string `json:"code"`
		Name    string `json:"name"`
		Address string `json:"address"`
		Phone   string `json:"phone"`
	}
	if loadJSON(seedsDir, "03_stores.json", &stores) {
		for _, s := range stores {
			_, _ = pool.Exec(ctx, `
				INSERT INTO governance.stores (id, organization_id, facility_id, code, name, address, phone)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				ON CONFLICT (code) DO NOTHING
			`, s.ID, s.OrgID, s.FacID, s.Code, s.Name, s.Address, s.Phone)
		}
		log.Printf("  ✓ 03_stores.json: %d seeded", len(stores))
	}

	// 4. Cash Registers
	var regs []struct {
		ID           string `json:"id"`
		StoreID      string `json:"store_id"`
		TerminalCode string `json:"terminal_code"`
		Name         string `json:"name"`
		IsActive     bool   `json:"is_active"`
	}
	if loadJSON(seedsDir, "04_cash_registers.json", &regs) {
		for _, r := range regs {
			_, _ = pool.Exec(ctx, `
				INSERT INTO retail.cash_registers (id, store_id, terminal_code, name, is_active)
				VALUES ($1, $2, $3, $4, $5)
				ON CONFLICT (terminal_code) DO NOTHING
			`, r.ID, r.StoreID, r.TerminalCode, r.Name, r.IsActive)
		}
		log.Printf("  ✓ 04_cash_registers.json: %d seeded", len(regs))
	}

	// 5. Users
	var users []struct {
		ID                 string  `json:"id"`
		OrgID              string  `json:"organization_id"`
		Email              string  `json:"email"`
		Phone              string  `json:"phone"`
		PasswordHash       string  `json:"password_hash"`
		FullName           string  `json:"full_name"`
		Status             string  `json:"status"`
		AssignedStoreID    *string `json:"assigned_store_id"`
		AssignedFacilityID *string `json:"assigned_facility_id"`
	}
	if loadJSON(seedsDir, "06_users.json", &users) {
		for _, u := range users {
			_, _ = pool.Exec(ctx, `
				INSERT INTO identity.users (id, organization_id, email, phone, password_hash, full_name, status, assigned_store_id, assigned_facility_id)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
				ON CONFLICT (email) DO NOTHING
			`, u.ID, u.OrgID, u.Email, u.Phone, u.PasswordHash, u.FullName, u.Status, u.AssignedStoreID, u.AssignedFacilityID)
		}
		log.Printf("  ✓ 06_users.json: %d seeded", len(users))
	}

	// 6. User Roles
	var userRoles []struct {
		UserEmail string `json:"user_email"`
		RoleCode  string `json:"role_code"`
	}
	if loadJSON(seedsDir, "07_user_roles.json", &userRoles) {
		for _, ur := range userRoles {
			_, _ = pool.Exec(ctx, `
				INSERT INTO identity.user_roles (user_id, role_id)
				SELECT u.id, r.id FROM identity.users u, identity.roles r
				WHERE u.email = $1 AND r.code = $2
				ON CONFLICT (user_id, role_id) DO NOTHING
			`, ur.UserEmail, ur.RoleCode)
		}
		log.Printf("  ✓ 07_user_roles.json: %d seeded", len(userRoles))
	}

	// 7. Varieties
	var vars []struct {
		ID           string `json:"id"`
		CategoryCode string `json:"category_code"`
		Code         string `json:"code"`
		Name         string `json:"name"`
		Flavor       string `json:"flavor_profile"`
	}
	if loadJSON(seedsDir, "10_varieties.json", &vars) {
		for _, v := range vars {
			_, _ = pool.Exec(ctx, `
				INSERT INTO catalog.varieties (id, category_id, code, name, flavor_profile)
				SELECT $1, c.id, $2, $3, $4 FROM catalog.categories c WHERE c.code = $5
				ON CONFLICT (code) DO NOTHING
			`, v.ID, v.Code, v.Name, v.Flavor, v.CategoryCode)
		}
		log.Printf("  ✓ 10_varieties.json: %d seeded", len(vars))
	}

	// 8. Products
	var prods []struct {
		ID             string  `json:"id"`
		CategoryCode   string  `json:"category_code"`
		VarietyCode    string  `json:"variety_code"`
		SKU            string  `json:"sku"`
		Barcode        string  `json:"barcode"`
		PLUCode        string  `json:"plu_code"`
		Name           string  `json:"name"`
		Description    string  `json:"description"`
		UOMCode        string  `json:"uom_code"`
		IsCatchWeight  bool    `json:"is_catch_weight"`
		OptimumTemp    float64 `json:"optimum_storage_temp_c"`
		ExpectedShelf  int     `json:"expected_shelf_life_days"`
		ImageURL       string  `json:"image_url"`
	}
	if loadJSON(seedsDir, "11_products.json", &prods) {
		for _, p := range prods {
			_, _ = pool.Exec(ctx, `
				INSERT INTO catalog.products (
					id, category_id, variety_id, sku, barcode, plu_code, name,
					description, primary_uom_id, is_catch_weight, optimum_storage_temp_c,
					expected_shelf_life_days, image_url
				)
				SELECT $1, c.id, v.id, $2, $3, $4, $5, $6, u.id, $7, $8, $9, $10
				FROM catalog.categories c, catalog.varieties v, catalog.units_of_measure u
				WHERE c.code = $11 AND v.code = $12 AND u.code = $13
				ON CONFLICT (sku) DO NOTHING
			`, p.ID, p.SKU, p.Barcode, p.PLUCode, p.Name, p.Description, p.IsCatchWeight, p.OptimumTemp, p.ExpectedShelf, p.ImageURL,
				p.CategoryCode, p.VarietyCode, p.UOMCode)
		}
		log.Printf("  ✓ 11_products.json: %d seeded", len(prods))
	}

	// 9. Product Prices
	var prices []struct {
		ProductSKU   string `json:"product_sku"`
		Channel      string `json:"channel"`
		BasePrice    int64  `json:"base_price_cents"`
		ComparePrice int64  `json:"compare_at_price_cents"`
	}
	if loadJSON(seedsDir, "12_product_prices.json", &prices) {
		for _, pr := range prices {
			_, _ = pool.Exec(ctx, `
				INSERT INTO catalog.product_prices (product_id, channel, base_price_cents, compare_at_price_cents)
				SELECT p.id, $1, $2, $3 FROM catalog.products p WHERE p.sku = $4
				ON CONFLICT (product_id, channel) DO NOTHING
			`, pr.Channel, pr.BasePrice, pr.ComparePrice, pr.ProductSKU)
		}
		log.Printf("  ✓ 12_product_prices.json: %d seeded", len(prices))
	}

	// 10. Suppliers
	var sups []struct {
		ID          string  `json:"id"`
		Code        string  `json:"code"`
		CompanyName string  `json:"company_name"`
		ContactName string  `json:"contact_name"`
		Email       string  `json:"email"`
		Phone       string  `json:"phone"`
		City        string  `json:"city"`
		Rating      float64 `json:"rating"`
	}
	if loadJSON(seedsDir, "13_suppliers.json", &sups) {
		for _, s := range sups {
			_, _ = pool.Exec(ctx, `
				INSERT INTO procurement.suppliers (id, code, company_name, contact_name, email, phone, city, rating)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
				ON CONFLICT (code) DO NOTHING
			`, s.ID, s.Code, s.CompanyName, s.ContactName, s.Email, s.Phone, s.City, s.Rating)
		}
		log.Printf("  ✓ 13_suppliers.json: %d seeded", len(sups))
	}

	// 11. Farms
	var farms []struct {
		ID            string `json:"id"`
		SupplierID    string `json:"supplier_id"`
		Name          string `json:"name"`
		Region        string `json:"region"`
		Altitude      int    `json:"altitude_meters"`
		Certification string `json:"certification"`
	}
	if loadJSON(seedsDir, "14_farms.json", &farms) {
		for _, f := range farms {
			_, _ = pool.Exec(ctx, `
				INSERT INTO production.farms (id, supplier_id, name, region, altitude_meters, certification)
				VALUES ($1, $2, $3, $4, $5, $6)
				ON CONFLICT DO NOTHING
			`, f.ID, f.SupplierID, f.Name, f.Region, f.Altitude, f.Certification)
		}
		log.Printf("  ✓ 14_farms.json: %d seeded", len(farms))
	}

	// 12. Batches
	var batches []struct {
		ID            string  `json:"id"`
		BatchCode     string  `json:"batch_code"`
		ProductSKU    string  `json:"product_sku"`
		FarmID        string  `json:"farm_id"`
		SupplierID    string  `json:"supplier_id"`
		HarvestOffset int     `json:"days_harvest_offset"`
		RecvOffset    int     `json:"days_receiving_offset"`
		BBOffset      int     `json:"days_best_before_offset"`
		ExpiryOffset  int     `json:"days_expiry_offset"`
		QualityGrade  string  `json:"quality_grade"`
		Brix          float64 `json:"measured_brix"`
		InitialQty    float64 `json:"initial_quantity_base"`
		RemainingQty  float64 `json:"remaining_quantity_base"`
		Status        string  `json:"status"`
	}
	if loadJSON(seedsDir, "15_batches.json", &batches) {
		for _, b := range batches {
			_, _ = pool.Exec(ctx, `
				INSERT INTO traceability.batches (
					id, batch_code, product_id, farm_id, supplier_id,
					harvest_date, receiving_date, best_before_date, expiry_date,
					quality_grade, measured_brix, initial_quantity_base, remaining_quantity_base, status
				)
				SELECT $1, $2, p.id, $3, $4,
					CURRENT_DATE + ($5 * INTERVAL '1 day'), CURRENT_DATE + ($6 * INTERVAL '1 day'),
					CURRENT_DATE + ($7 * INTERVAL '1 day'), CURRENT_DATE + ($8 * INTERVAL '1 day'),
					$9, $10, $11, $12, $13
				FROM catalog.products p WHERE p.sku = $14
				ON CONFLICT (batch_code) DO NOTHING
			`, b.ID, b.BatchCode, b.FarmID, b.SupplierID,
				b.HarvestOffset, b.RecvOffset, b.BBOffset, b.ExpiryOffset,
				b.QualityGrade, b.Brix, b.InitialQty, b.RemainingQty, b.Status, b.ProductSKU)
		}
		log.Printf("  ✓ 15_batches.json: %d seeded", len(batches))
	}

	// 13. Stock Balances
	var balances []struct {
		FacilityCode string  `json:"facility_code"`
		StoreCode    string  `json:"store_code"`
		BatchCode    string  `json:"batch_code"`
		OnHand       float64 `json:"quantity_on_hand_base"`
		Reserved     float64 `json:"quantity_reserved_base"`
	}
	if loadJSON(seedsDir, "16_stock_balances.json", &balances) {
		for _, bl := range balances {
			if bl.FacilityCode != "" {
				_, _ = pool.Exec(ctx, `
					INSERT INTO inventory.stock_balances (facility_id, store_id, product_id, batch_id, quantity_on_hand_base, quantity_reserved_base)
					SELECT f.id, NULL, b.product_id, b.id, $1, $2
					FROM governance.facilities f, traceability.batches b
					WHERE f.code = $3 AND b.batch_code = $4
					ON CONFLICT DO NOTHING
				`, bl.OnHand, bl.Reserved, bl.FacilityCode, bl.BatchCode)
			} else if bl.StoreCode != "" {
				_, _ = pool.Exec(ctx, `
					INSERT INTO inventory.stock_balances (facility_id, store_id, product_id, batch_id, quantity_on_hand_base, quantity_reserved_base)
					SELECT NULL, s.id, b.product_id, b.id, $1, $2
					FROM governance.stores s, traceability.batches b
					WHERE s.code = $3 AND b.batch_code = $4
					ON CONFLICT DO NOTHING
				`, bl.OnHand, bl.Reserved, bl.StoreCode, bl.BatchCode)
			}
		}
		log.Printf("  ✓ 16_stock_balances.json: %d seeded", len(balances))
	}

	// 14. Cashier Shifts
	var shifts []struct {
		ID            string `json:"id"`
		TerminalCode  string `json:"register_terminal_code"`
		CashierEmail  string `json:"cashier_email"`
		HoursAgo      int    `json:"hours_ago"`
		OpeningFloat  int64  `json:"opening_cash_float_cents"`
		TotalCount    int    `json:"total_sales_count"`
		TotalAmount   int64  `json:"total_sales_amount_cents"`
		Status        string `json:"status"`
		Notes         string `json:"notes"`
	}
	if loadJSON(seedsDir, "17_cashier_shifts.json", &shifts) {
		for _, sh := range shifts {
			_, _ = pool.Exec(ctx, `
				INSERT INTO retail.cashier_shifts (
					id, register_id, cashier_user_id, opened_at, opening_cash_float_cents,
					total_sales_count, total_sales_amount_cents, status, notes
				)
				SELECT $1, r.id, u.id, NOW() - ($2 * INTERVAL '1 hour'), $3, $4, $5, $6, $7
				FROM retail.cash_registers r, identity.users u
				WHERE r.terminal_code = $8 AND u.email = $9
				ON CONFLICT DO NOTHING
			`, sh.ID, sh.HoursAgo, sh.OpeningFloat, sh.TotalCount, sh.TotalAmount, sh.Status, sh.Notes,
				sh.TerminalCode, sh.CashierEmail)
		}
		log.Printf("  ✓ 17_cashier_shifts.json: %d seeded", len(shifts))
	}
}

func loadJSON(dir, filename string, target interface{}) bool {
	p := filepath.Join(dir, filename)
	data, err := os.ReadFile(p)
	if err != nil {
		log.Printf("  ⚠️ Could not read %s: %v", filename, err)
		return false
	}
	if err := json.Unmarshal(data, target); err != nil {
		log.Printf("  ⚠️ Could not parse %s: %v", filename, err)
		return false
	}
	return true
}
