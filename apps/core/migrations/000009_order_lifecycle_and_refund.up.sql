-- ========================================================
-- BERRY FRESH CORE — MIGRATION 000009: COMMERCE LIFECYCLE & REFUND
-- ========================================================

-- 1. Extend commerce.orders status constraint to include REFUNDED
ALTER TABLE commerce.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE commerce.orders ADD CONSTRAINT orders_status_check CHECK (status IN (
    'PENDING_PAYMENT', 'PAID', 'ALLOCATED', 'PACKING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'REFUNDED'
));

-- 2. Add refund audit columns to commerce.orders
ALTER TABLE commerce.orders ADD COLUMN IF NOT EXISTS refund_amount_cents BIGINT DEFAULT 0;
ALTER TABLE commerce.orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE commerce.orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- 3. Optimization Index for FEFO Stock Reservation Background Sweeper
CREATE INDEX IF NOT EXISTS idx_stock_reservations_sweeper 
ON inventory.stock_reservations (status, expires_at) 
WHERE status = 'ACTIVE';

-- 4. Index for Commerce Order Status queries
CREATE INDEX IF NOT EXISTS idx_commerce_orders_status_created 
ON commerce.orders (status, created_at DESC);
