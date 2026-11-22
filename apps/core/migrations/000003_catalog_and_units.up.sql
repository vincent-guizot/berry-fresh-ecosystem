-- ========================================================
-- BERRY FRESH CORE — MIGRATION 000003: CATALOG & UNITS
-- ========================================================

-- Units of Measure (Normalized Base: GRAMS for mass, PIECE for count)
CREATE TABLE IF NOT EXISTS catalog.units_of_measure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('MASS', 'COUNT', 'VOLUME')),
    base_conversion_factor NUMERIC(12, 4) NOT NULL DEFAULT 1.0000, -- e.g. 1 kg = 1000.0000 grams
    is_base_unit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Standard Fruit Units
INSERT INTO catalog.units_of_measure (code, name, unit_type, base_conversion_factor, is_base_unit) VALUES
    ('G', 'Gram', 'MASS', 1.0000, TRUE),
    ('KG', 'Kilogram', 'MASS', 1000.0000, FALSE),
    ('PCS', 'Piece', 'COUNT', 1.0000, TRUE),
    ('PUNNET_125', '125g Punnet / Clamshell', 'COUNT', 125.0000, FALSE),
    ('PUNNET_250', '250g Punnet / Clamshell', 'COUNT', 250.0000, FALSE),
    ('PUNNET_500', '500g Punnet / Clamshell', 'COUNT', 500.0000, FALSE),
    ('CRATE_5KG', '5kg Harvest Crate', 'COUNT', 5000.0000, FALSE)
ON CONFLICT (code) DO NOTHING;

-- Categories
CREATE TABLE IF NOT EXISTS catalog.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Categories
INSERT INTO catalog.categories (code, name, description, icon_name) VALUES
    ('BERRIES', 'Fresh Berries', 'Strawberries, Blueberries, Raspberries, Blackberries', 'berry'),
    ('STONE_FRUITS', 'Stone Fruits', 'Cherries, Peaches, Plums', 'fruit'),
    ('MUSHROOMS', 'Exotic Mushrooms', 'Shiitake, Oyster, King Oyster', 'mushroom'),
    ('HERBS', 'Culinary Herbs & Spices', 'Mint, Basil, Rosemary', 'herb')
ON CONFLICT (code) DO NOTHING;

-- Varieties (Cultivars)
CREATE TABLE IF NOT EXISTS catalog.varieties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES catalog.categories(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    scientific_name VARCHAR(150),
    flavor_profile TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (Sellable & Inventory Items)
CREATE TABLE IF NOT EXISTS catalog.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES catalog.categories(id),
    variety_id UUID REFERENCES catalog.varieties(id),
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    plu_code VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    primary_uom_id UUID NOT NULL REFERENCES catalog.units_of_measure(id),
    is_catch_weight BOOLEAN DEFAULT FALSE, -- True if weighed dynamically per gram at scale
    optimum_storage_temp_c NUMERIC(4, 1) DEFAULT 2.0,
    expected_shelf_life_days INT DEFAULT 5,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Standard Pricing (Base Unit IDR in integer cents/rupiah)
CREATE TABLE IF NOT EXISTS catalog.product_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('ECOMMERCE', 'POS', 'MANUAL')),
    currency VARCHAR(3) DEFAULT 'IDR',
    base_price_cents BIGINT NOT NULL, -- e.g. Rp 45,000 = 45000
    compare_at_price_cents BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    UNIQUE (product_id, channel)
);
