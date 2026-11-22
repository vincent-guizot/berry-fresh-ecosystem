-- ========================================================
-- BERRY FRESH CORE — MIGRATION 000006: COMMERCE & RETAIL (POS)
-- ========================================================

-- Customers (E-Commerce & Retail Loyalty)
CREATE TABLE IF NOT EXISTS commerce.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) UNIQUE,
    loyalty_points INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Delivery Addresses
CREATE TABLE IF NOT EXISTS commerce.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES commerce.customers(id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Home',
    recipient_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- E-Commerce Orders
CREATE TABLE IF NOT EXISTS commerce.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES commerce.customers(id),
    delivery_address_id UUID REFERENCES commerce.customer_addresses(id),
    status VARCHAR(30) DEFAULT 'PENDING_PAYMENT' CHECK (status IN (
        'PENDING_PAYMENT', 'PAID', 'ALLOCATED', 'PACKING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'
    )),
    subtotal_cents BIGINT NOT NULL,
    delivery_fee_cents BIGINT DEFAULT 0,
    discount_cents BIGINT DEFAULT 0,
    tax_cents BIGINT DEFAULT 0,
    total_amount_cents BIGINT NOT NULL,
    payment_method VARCHAR(50), -- 'QRIS', 'BANK_TRANSFER', 'CASH_ON_DELIVERY'
    payment_reference VARCHAR(100),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS commerce.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES commerce.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES catalog.products(id),
    batch_id UUID REFERENCES traceability.batches(id),
    ordered_quantity NUMERIC(12, 4) NOT NULL,
    uom_id UUID NOT NULL REFERENCES catalog.units_of_measure(id),
    unit_price_cents BIGINT NOT NULL,
    line_total_cents BIGINT NOT NULL
);

-- Retail POS Cash Registers (Hardware terminals in store)
CREATE TABLE IF NOT EXISTS retail.cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES governance.stores(id) ON DELETE CASCADE,
    terminal_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'POS-REG-01'
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retail Cashier Shifts (Opening & Closing Drawer Audits)
CREATE TABLE IF NOT EXISTS retail.cashier_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_id UUID NOT NULL REFERENCES retail.cash_registers(id),
    cashier_user_id UUID NOT NULL REFERENCES identity.users(id),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opening_cash_float_cents BIGINT NOT NULL DEFAULT 0,
    closing_cash_actual_cents BIGINT,
    expected_cash_cents BIGINT,
    cash_discrepancy_cents BIGINT,
    total_sales_count INT DEFAULT 0,
    total_sales_amount_cents BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'RECONCILED')),
    notes TEXT
);

-- Retail POS Sales Transactions
CREATE TABLE IF NOT EXISTS retail.pos_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'BF-POS-YYYYMMDD-0001'
    shift_id UUID NOT NULL REFERENCES retail.cashier_shifts(id),
    store_id UUID NOT NULL REFERENCES governance.stores(id),
    customer_id UUID REFERENCES commerce.customers(id),
    subtotal_cents BIGINT NOT NULL,
    discount_cents BIGINT DEFAULT 0,
    tax_cents BIGINT DEFAULT 0,
    total_amount_cents BIGINT NOT NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('CASH', 'QRIS_DYNAMIC', 'DEBIT_CARD', 'SPLIT')),
    cash_tendered_cents BIGINT,
    cash_change_cents BIGINT,
    transacted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retail POS Sale Items
CREATE TABLE IF NOT EXISTS retail.pos_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pos_sale_id UUID NOT NULL REFERENCES retail.pos_sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES catalog.products(id),
    batch_id UUID NOT NULL REFERENCES traceability.batches(id),
    sold_quantity_base NUMERIC(14, 4) NOT NULL, -- grams for catch-weight, pieces for clamshell
    unit_price_cents BIGINT NOT NULL,
    line_total_cents BIGINT NOT NULL,
    weighed_on_scale BOOLEAN DEFAULT FALSE
);
