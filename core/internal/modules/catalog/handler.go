package catalog

import (
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
	Tags                []string `json:"tags"`
}

var sampleProducts = []ProductDTO{
	{
		ID:                  "prod-sb-250",
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
		ID:                  "prod-sb-loose",
		SKU:                 "BF-STR-SWC-KG",
		Barcode:             "899123456702",
		PLUCode:             "4012",
		Name:                "Sweet Charlie Strawberries (Loose Catch-Weight)",
		Category:            "Fresh Berries",
		Variety:             "Sweet Charlie",
		UOM:                 "KG",
		UOMName:             "Kilogram (Weighed on Scale)",
		IsCatchWeight:       true,
		PriceCents:          120000, // Rp 120,000 / kg (or Rp 120 / gram)
		CompareAtPriceCents: 140000,
		ImageURL:            "https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80",
		ShelfLifeDays:       4,
		StorageTempC:        2.5,
		Tags:                []string{"Loose Scale", "Baking Grade"},
	},
	{
		ID:                  "prod-bb-125",
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
		ID:                  "prod-bb-250",
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
		Tags:                []string{"Jumbo Berries", "Crisp Texture"},
	},
	{
		ID:                  "prod-rb-125",
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
		ID:                  "prod-bk-125",
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
	category := c.Query("category")
	channel := c.Query("channel", "ECOMMERCE")

	var filtered []ProductDTO
	for _, p := range sampleProducts {
		if category != "" && category != "All" && p.Category != category {
			continue
		}
		filtered = append(filtered, p)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"channel": channel,
		"count":   len(filtered),
		"data":    filtered,
	})
}

func (h *CatalogHandler) GetProductByID(c fiber.Ctx) error {
	id := c.Params("id")
	for _, p := range sampleProducts {
		if p.ID == id || p.SKU == id || p.Barcode == id || p.PLUCode == id {
			return c.JSON(fiber.Map{"success": true, "data": p})
		}
	}
	return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"success": false, "message": "Product not found"})
}

func (h *CatalogHandler) GetPLUQuickKeys(c fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"success": true,
		"data":    sampleProducts,
	})
}
