-- ========================================================
-- BERRY FRESH CORE — MIGRATION 000004: PROCUREMENT & TRACEABILITY
-- ========================================================

-- Suppliers
CREATE TABLE IF NOT EXISTS procurement.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(150),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    rating NUMERIC(3, 2) DEFAULT 5.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farms (Upstream production origin)
CREATE TABLE IF NOT EXISTS production.farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES procurement.suppliers(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    altitude_meters INT,
    certification VARCHAR(100), -- e.g. 'GlobalG.A.P', 'Organik Indonesia'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batches (The central provenance record for every fruit lot)
CREATE TABLE IF NOT EXISTS traceability.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_code VARCHAR(100) UNIQUE NOT NULL, -- Format: BF-YYYYMMDD-PRODUCT-LOT
    product_id UUID NOT NULL REFERENCES catalog.products(id),
    farm_id UUID REFERENCES production.farms(id),
    supplier_id UUID REFERENCES procurement.suppliers(id),
    harvest_date DATE NOT NULL,
    receiving_date DATE NOT NULL DEFAULT CURRENT_DATE,
    best_before_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    quality_grade VARCHAR(20) NOT NULL DEFAULT 'GRADE_A' CHECK (quality_grade IN ('GRADE_A', 'GRADE_B', 'GRADE_C', 'REJECTED')),
    measured_brix NUMERIC(4, 1),
    initial_quantity_base NUMERIC(14, 4) NOT NULL, -- in base units (grams or pieces)
    remaining_quantity_base NUMERIC(14, 4) NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DEPLETED', 'QUARANTINED', 'EXPIRED', 'DISCARDED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast FEFO lookups: active batches sorted by best_before_date ASC
CREATE INDEX IF NOT EXISTS idx_batches_fefo ON traceability.batches (product_id, status, best_before_date ASC);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS procurement.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES procurement.suppliers(id),
    destination_facility_id UUID NOT NULL REFERENCES governance.facilities(id),
    status VARCHAR(30) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'RECEIVED', 'CANCELLED')),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    total_amount_cents BIGINT DEFAULT 0,
    created_by UUID REFERENCES identity.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS procurement.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES procurement.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES catalog.products(id),
    ordered_quantity NUMERIC(12, 4) NOT NULL,
    uom_id UUID NOT NULL REFERENCES catalog.units_of_measure(id),
    unit_price_cents BIGINT NOT NULL,
    line_total_cents BIGINT NOT NULL
);

-- Receiving Records (Dock Inspection)
CREATE TABLE IF NOT EXISTS procurement.receiving_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receiving_number VARCHAR(50) UNIQUE NOT NULL,
    purchase_order_id UUID REFERENCES procurement.purchase_orders(id),
    facility_id UUID NOT NULL REFERENCES governance.facilities(id),
    received_by UUID REFERENCES identity.users(id),
    received_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Receiving Items (with Brix & Grade inspection)
CREATE TABLE IF NOT EXISTS procurement.receiving_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receiving_record_id UUID NOT NULL REFERENCES procurement.receiving_records(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES traceability.batches(id),
    received_gross_kg NUMERIC(10, 3) NOT NULL,
    tare_weight_kg NUMERIC(10, 3) DEFAULT 0.000,
    net_weight_kg NUMERIC(10, 3) NOT NULL,
    sample_brix NUMERIC(4, 1),
    sample_temp_c NUMERIC(4, 1),
    defect_percentage NUMERIC(5, 2) DEFAULT 0.00,
    assigned_grade VARCHAR(20) NOT NULL
);
