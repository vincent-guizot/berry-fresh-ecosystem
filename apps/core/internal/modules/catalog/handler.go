package catalog

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"berryfresh/core/internal/database"

	"github.com/gofiber/fiber/v3"
)

type CatalogHandler struct {
	db *database.Database
}

func NewCatalogHandler(db *database.Database) *CatalogHandler {
	return &CatalogHandler{db: db}
}

type ProductDTO struct {
	ID                  string   `json:"id"`
	SKU                 string   `json:"sku"`
	Barcode             string   `json:"barcode"`
	PLUCode             string   `json:"plu_code"`
	Name                string   `json:"name"`
	Category            string   `json:"category"`
	Variety             string   `json:"variety"`
	UOM                 string   `json:"uom"`
	UOMName             string   `json:"uom_name"`
	IsCatchWeight       bool     `json:"is_catch_weight"` // Weighed at scale
	PriceCents          int64    `json:"price_cents"`     // Base IDR amount
	CompareAtPriceCents int64    `json:"compare_at_price_cents,omitempty"`
	ImageURL            string   `json:"image_url"`
	ShelfLifeDays       int      `json:"shelf_life_days"`
	StorageTempC        float64  `json:"storage_temp_c"`
	Tags                []string `json:"tags,omitempty"`
}

var fallbackProducts = []ProductDTO{
	{
		ID:                  "10000000-0000-0000-0000-000000000001",
		SKU:                 "BF-STR-ALB-250G",
		Barcode:             "899123456701",
		PLUCode:             "4011",
		Name:                "Albion Strawberries (Grade A, 250g Punnet)",
		Category:            "Fresh Berries",
		Variety:             "Albion High-Sugar",
		UOM:                 "PUNNET_250",
		UOMName:             "250g Clamshell",
		IsCatchWeight:       false,
		PriceCents:          38000,
		CompareAtPriceCents: 45000,
		ImageURL:            "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80",
		ShelfLifeDays:       5,
		StorageTempC:        2.0,
		Tags:                []string{"Best Seller", "Grade A", "Sweetness 9°+ Brix"},
	},
	{
		ID:                  "10000000-0000-0000-0000-000000000002",
		SKU:                 "BF-STR-SWC-KG",
		Barcode:             "899123456702",
		PLUCode:             "4012",
		Name:                "Sweet Charlie Strawberries (Loose Catch-Weight)",
		Category:            "Fresh Berries",
		Variety:             "Sweet Charlie",
		UOM:                 "KG",
		UOMName:             "Kilogram (Weighed on Scale)",
		IsCatchWeight:       true,
		PriceCents:          120000,
		CompareAtPriceCents: 140000,
		ImageURL:            "https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80",
		ShelfLifeDays:       4,
		StorageTempC:        2.5,
		Tags:                []string{"Loose Scale", "Baking Grade"},
	},
	{
		ID:                  "10000000-0000-0000-0000-000000000003",
		SKU:                 "BF-BLU-DUK-125G",
		Barcode:             "899123456703",
		PLUCode:             "4021",
		Name:                "Highland Duke Blueberries (125g Punnet)",
		Category:            "Fresh Berries",
		Variety:             "Duke Super-Blue",
		UOM:                 "PUNNET_125",
		UOMName:             "125g Clamshell",
		IsCatchWeight:       false,
		PriceCents:          52000,
		CompareAtPriceCents: 60000,
		ImageURL:            "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=600&q=80",
		ShelfLifeDays:       10,
		StorageTempC:        1.5,
		Tags:                []string{"Superfood", "Anthocyanin Rich"},
	},
	{
		ID:                  "10000000-0000-0000-0000-000000000004",
		SKU:                 "BF-BLU-EME-250G",
		Barcode:             "899123456704",
		PLUCode:             "4022",
		Name:                "Emerald Blueberries Jumbo (250g Family Pack)",
		Category:            "Fresh Berries",
		Variety:             "Emerald Jumbo",
		UOM:                 "PUNNET_250",
		UOMName:             "250g Clamshell",
		IsCatchWeight:       false,
		PriceCents:          85000,
		CompareAtPriceCents: 98000,
		ImageURL:            "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?auto=format&fit=crop&w=600&q=80",
		ShelfLifeDays:       10,
		StorageTempC:        1.5,
		Tags:                []string{"Jumbo Berries", "Crisp"},
	},
	{
		ID:                  "10000000-0000-0000-0000-000000000005",
		SKU:                 "BF-RAS-HER-125G",
		Barcode:             "899123456705",
		PLUCode:             "4031",
		Name:                "Heritage Red Raspberries (125g Punnet)",
		Category:            "Fresh Berries",
		Variety:             "Heritage Royal",
		UOM:                 "PUNNET_125",
		UOMName:             "125g Clamshell",
		IsCatchWeight:       false,
		PriceCents:          65000,
		CompareAtPriceCents: 75000,
		ImageURL:            "https://images.unsplash.com/photo-1577069808021-766782559595?auto=format&fit=crop&w=600&q=80",
		ShelfLifeDays:       4,
		StorageTempC:        1.0,
		Tags:                []string{"Delicate", "High Fiber"},
	},
	{
		ID:                  "10000000-0000-0000-0000-000000000006",
		SKU:                 "BF-BLK-ARK-125G",
		Barcode:             "899123456706",
		PLUCode:             "4041",
		Name:                "Prime-Ark Blackberries (125g Punnet)",
		Category:            "Fresh Berries",
		Variety:             "Prime-Ark Freedom",
		UOM:                 "PUNNET_125",
		UOMName:             "125g Clamshell",
		IsCatchWeight:       false,
		PriceCents:          58000,
		CompareAtPriceCents: 68000,
		ImageURL:            "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&q=80",
		ShelfLifeDays:       6,
		StorageTempC:        1.5,
		Tags:                []string{"Sweet & Tart", "Antioxidants"},
	},
}

func (h *CatalogHandler) GetProducts(c fiber.Ctx) error {
	channel := c.Query("channel", "ECOMMERCE")
	search := strings.TrimSpace(c.Query("search", ""))
	category := strings.TrimSpace(c.Query("category", ""))
	variety := strings.TrimSpace(c.Query("variety", ""))

	limit, _ := strconv.Atoi(c.Query("limit", "50"))
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	offset, _ := strconv.Atoi(c.Query("offset", "0"))
	if offset < 0 {
		offset = 0
	}

	if h.db != nil && h.db.Pool != nil {
		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		var conditions []string
		var args []interface{}
		argIdx := 1

		conditions = append(conditions, "p.is_active = TRUE")

		if search != "" {
			conditions = append(conditions, fmt.Sprintf("(p.name ILIKE $%d OR p.sku ILIKE $%d OR p.barcode ILIKE $%d OR p.plu_code ILIKE $%d)", argIdx, argIdx, argIdx, argIdx))
			args = append(args, "%"+search+"%")
			argIdx++
		}

		if category != "" && category != "All" {
			conditions = append(conditions, fmt.Sprintf("c.name ILIKE $%d", argIdx))
			args = append(args, "%"+category+"%")
			argIdx++
		}

		if variety != "" && variety != "All" {
			conditions = append(conditions, fmt.Sprintf("v.name ILIKE $%d", argIdx))
			args = append(args, "%"+variety+"%")
			argIdx++
		}

		whereClause := "WHERE " + strings.Join(conditions, " AND ")

		// Query total count
		var totalCount int
		countQuery := fmt.Sprintf(`
			SELECT count(*)
			FROM catalog.products p
			JOIN catalog.categories c ON c.id = p.category_id
			LEFT JOIN catalog.varieties v ON v.id = p.variety_id
			%s
		`, whereClause)

		_ = h.db.Pool.QueryRow(ctx, countQuery, args...).Scan(&totalCount)

		// Query products with prices
		args = append(args, channel, limit, offset)
		query := fmt.Sprintf(`
			SELECT p.id, p.sku, COALESCE(p.barcode, ''), COALESCE(p.plu_code, ''), p.name,
			       c.name AS category, COALESCE(v.name, '') AS variety,
			       u.code AS uom, u.name AS uom_name, p.is_catch_weight,
			       COALESCE(pp.base_price_cents, 0) AS price_cents,
			       COALESCE(pp.compare_at_price_cents, 0) AS compare_at_price_cents,
			       COALESCE(p.image_url, '') AS image_url,
			       p.expected_shelf_life_days, p.optimum_storage_temp_c
			FROM catalog.products p
			JOIN catalog.categories c ON c.id = p.category_id
			LEFT JOIN catalog.varieties v ON v.id = p.variety_id
			JOIN catalog.units_of_measure u ON u.id = p.primary_uom_id
			LEFT JOIN catalog.product_prices pp ON pp.product_id = p.id AND pp.channel = $%d AND pp.is_active = TRUE
			%s
			ORDER BY p.name ASC
			LIMIT $%d OFFSET $%d
		`, argIdx, whereClause, argIdx+1, argIdx+2)

		rows, err := h.db.Pool.Query(ctx, query, args...)
		if err == nil {
			defer rows.Close()
			var products []ProductDTO
			for rows.Next() {
				var p ProductDTO
				var shelfLife int
				var temp float64
				err := rows.Scan(
					&p.ID, &p.SKU, &p.Barcode, &p.PLUCode, &p.Name,
					&p.Category, &p.Variety, &p.UOM, &p.UOMName,
					&p.IsCatchWeight, &p.PriceCents, &p.CompareAtPriceCents,
					&p.ImageURL, &shelfLife, &temp,
				)
				if err == nil {
					p.ShelfLifeDays = shelfLife
					p.StorageTempC = temp
					products = append(products, p)
				}
			}

			if len(products) > 0 {
				return c.JSON(fiber.Map{
					"success": true,
					"count":   len(products),
					"total":   totalCount,
					"limit":   limit,
					"offset":  offset,
					"data":    products,
				})
			}
		}
	}

	// Filter in-memory fallback
	var filtered []ProductDTO
	for _, p := range fallbackProducts {
		if search != "" && !strings.Contains(strings.ToLower(p.Name), strings.ToLower(search)) &&
			!strings.Contains(strings.ToLower(p.SKU), strings.ToLower(search)) {
			continue
		}
		if category != "" && category != "All" && !strings.Contains(strings.ToLower(p.Category), strings.ToLower(category)) {
			continue
		}
		filtered = append(filtered, p)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"count":   len(filtered),
		"total":   len(filtered),
		"limit":   limit,
		"offset":  offset,
		"data":    filtered,
	})
}

func (h *CatalogHandler) GetProductByID(c fiber.Ctx) error {
	id := c.Params("id")

	if h.db != nil && h.db.Pool != nil {
		ctx, cancel := context.WithTimeout(c.Context(), 3*time.Second)
		defer cancel()

		query := `
			SELECT p.id, p.sku, COALESCE(p.barcode, ''), COALESCE(p.plu_code, ''), p.name,
			       c.name AS category, COALESCE(v.name, '') AS variety,
			       u.code AS uom, u.name AS uom_name, p.is_catch_weight,
			       COALESCE(pp.base_price_cents, 0) AS price_cents,
			       COALESCE(pp.compare_at_price_cents, 0) AS compare_at_price_cents,
			       COALESCE(p.image_url, '') AS image_url,
			       p.expected_shelf_life_days, p.optimum_storage_temp_c
			FROM catalog.products p
			JOIN catalog.categories c ON c.id = p.category_id
			LEFT JOIN catalog.varieties v ON v.id = p.variety_id
			JOIN catalog.units_of_measure u ON u.id = p.primary_uom_id
			LEFT JOIN catalog.product_prices pp ON pp.product_id = p.id AND pp.is_active = TRUE
			WHERE p.id::text = $1 OR p.sku = $1 OR p.barcode = $1
			LIMIT 1
		`
		var p ProductDTO
		var shelfLife int
		var temp float64
		err := h.db.Pool.QueryRow(ctx, query, id).Scan(
			&p.ID, &p.SKU, &p.Barcode, &p.PLUCode, &p.Name,
			&p.Category, &p.Variety, &p.UOM, &p.UOMName,
			&p.IsCatchWeight, &p.PriceCents, &p.CompareAtPriceCents,
			&p.ImageURL, &shelfLife, &temp,
		)
		if err == nil {
			p.ShelfLifeDays = shelfLife
			p.StorageTempC = temp
			return c.JSON(fiber.Map{"success": true, "data": p})
		}
	}

	for _, p := range fallbackProducts {
		if p.ID == id || p.SKU == id || p.Barcode == id {
			return c.JSON(fiber.Map{"success": true, "data": p})
		}
	}

	return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
		"success": false,
		"message": "Product not found",
	})
}

func (h *CatalogHandler) GetPLUQuickKeys(c fiber.Ctx) error {
	if h.db != nil && h.db.Pool != nil {
		ctx, cancel := context.WithTimeout(c.Context(), 3*time.Second)
		defer cancel()

		query := `
			SELECT p.id, p.sku, COALESCE(p.barcode, ''), p.plu_code, p.name,
			       c.name AS category, COALESCE(v.name, '') AS variety,
			       u.code AS uom, u.name AS uom_name, p.is_catch_weight,
			       COALESCE(pp.base_price_cents, 0) AS price_cents,
			       COALESCE(p.image_url, '') AS image_url
			FROM catalog.products p
			JOIN catalog.categories c ON c.id = p.category_id
			LEFT JOIN catalog.varieties v ON v.id = p.variety_id
			JOIN catalog.units_of_measure u ON u.id = p.primary_uom_id
			LEFT JOIN catalog.product_prices pp ON pp.product_id = p.id AND pp.channel = 'POS' AND pp.is_active = TRUE
			WHERE p.is_active = TRUE AND p.plu_code IS NOT NULL AND p.plu_code <> ''
			ORDER BY p.plu_code ASC
		`
		rows, err := h.db.Pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var pluList []ProductDTO
			for rows.Next() {
				var p ProductDTO
				if err := rows.Scan(
					&p.ID, &p.SKU, &p.Barcode, &p.PLUCode, &p.Name,
					&p.Category, &p.Variety, &p.UOM, &p.UOMName,
					&p.IsCatchWeight, &p.PriceCents, &p.ImageURL,
				); err == nil {
					pluList = append(pluList, p)
				}
			}
			if len(pluList) > 0 {
				return c.JSON(fiber.Map{"success": true, "count": len(pluList), "data": pluList})
			}
		}
	}

	return c.JSON(fiber.Map{"success": true, "count": len(fallbackProducts), "data": fallbackProducts})
}
