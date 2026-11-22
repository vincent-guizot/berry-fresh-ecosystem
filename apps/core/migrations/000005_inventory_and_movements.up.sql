-- ========================================================
-- BERRY FRESH CORE — MIGRATION 000005: INVENTORY & MOVEMENTS
-- ========================================================

-- Stock Balances (Normalized by Batch & Physical Location)
CREATE TABLE IF NOT EXISTS inventory.stock_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES governance.facilities(id) ON DELETE CASCADE,
    store_id UUID REFERENCES governance.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES catalog.products(id),
    batch_id UUID NOT NULL REFERENCES traceability.batches(id),
    quantity_on_hand_base NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    quantity_reserved_base NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    quantity_available_base NUMERIC(14, 4) GENERATED ALWAYS AS (quantity_on_hand_base - quantity_reserved_base) STORED,
    last_counted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_location CHECK (facility_id IS NOT NULL OR store_id IS NOT NULL),
    CONSTRAINT uq_stock_location_batch UNIQUE NULLS NOT DISTINCT (facility_id, store_id, product_id, batch_id)
);

-- Fast Index for FEFO inventory allocation per location
CREATE INDEX IF NOT EXISTS idx_stock_balances_fefo ON inventory.stock_balances (product_id, facility_id, store_id);

-- Stock Reservations (Temporary holds during checkout before payment confirmation)
CREATE TABLE IF NOT EXISTS inventory.stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_balance_id UUID NOT NULL REFERENCES inventory.stock_balances(id),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('ECOMMERCE', 'POS', 'MANUAL')),
    reference_id VARCHAR(100) NOT NULL, -- Order ID or Cart ID
    quantity_reserved_base NUMERIC(14, 4) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMMITTED', 'RELEASED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Immutable Append-Only Stock Movements Ledger
CREATE TABLE IF NOT EXISTS inventory.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN (
        'RECEIVING', 'TRANSFER_OUT', 'TRANSFER_IN', 'POS_SALE',
        'ECOMMERCE_SALE', 'SHRINKAGE', 'SPOILAGE', 'RETURN', 'ADJUSTMENT'
    )),
    facility_id UUID REFERENCES governance.facilities(id),
    store_id UUID REFERENCES governance.stores(id),
    product_id UUID NOT NULL REFERENCES catalog.products(id),
    batch_id UUID NOT NULL REFERENCES traceability.batches(id),
    quantity_change_base NUMERIC(14, 4) NOT NULL, -- positive for additions, negative for deductions
    running_balance_base NUMERIC(14, 4) NOT NULL,
    unit_cost_cents BIGINT DEFAULT 0,
    reference_type VARCHAR(50), -- e.g. 'pos_sale', 'ecommerce_order', 'receiving_record'
    reference_id VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES identity.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Adjustments (Audited Shrinkage & Spoilage Write-Offs)
CREATE TABLE IF NOT EXISTS inventory.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES governance.facilities(id),
    store_id UUID REFERENCES governance.stores(id),
    product_id UUID NOT NULL REFERENCES catalog.products(id),
    batch_id UUID NOT NULL REFERENCES traceability.batches(id),
    adjusted_quantity_base NUMERIC(14, 4) NOT NULL,
    reason_code VARCHAR(50) NOT NULL CHECK (reason_code IN (
        'MOISTURE_LOSS', 'SPOILED_DISCARD', 'DEFECT_DOWNGRADE',
        'DAMAGED_TRANSIT', 'COUNT_DISCREPANCY'
    )),
    reported_by UUID NOT NULL REFERENCES identity.users(id),
    approved_by UUID REFERENCES identity.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
