-- ========================================================
-- BERRY FRESH CORE — MIGRATION 000008: SEED INITIAL DATA
-- ========================================================

-- 1. Governance: Organizations
INSERT INTO governance.organizations (id, code, name, tax_id, currency)
VALUES ('a0000000-0000-0000-0000-000000000001', 'BF-HQ', 'Berry Fresh Holdings', '01.234.567.8-001.000', 'IDR')
ON CONFLICT (code) DO NOTHING;

-- 2. Governance: Facilities (Warehouse & Farms)
INSERT INTO governance.facilities (id, organization_id, code, name, facility_type, address, city, province, postal_code)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'WH-JKT-MAIN', 'Central Cold Storage Hub Jakarta', 'COLD_STORAGE', 'Kawasan Pergudangan Pluit Blok C No. 8', 'Jakarta Utara', 'DKI Jakarta', '14450'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'FARM-CWD-01', 'Ciwidey Highland Farm Plot 3', 'FARM', 'Jl. Raya Ciwidey KM 18', 'Bandung', 'Jawa Barat', '40973'),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'FARM-LMB-01', 'Lembang Sunrise Farm', 'FARM', 'Jl. Kolonel Masturi KM 4', 'Lembang', 'Jawa Barat', '40391'),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'FARM-BATU-01', 'Batu Highland Agro', 'FARM', 'Jl. Panderman Agro No. 12', 'Batu', 'Jawa Timur', '65311')
ON CONFLICT (code) DO NOTHING;

-- 3. Governance: Retail Stores
INSERT INTO governance.stores (id, organization_id, facility_id, code, name, address, phone)
VALUES ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'STORE-JKT-01', 'Berry Fresh Store Jakarta Central', 'Jl. Senopati No. 42, Kebayoran Baru', '021-5550192')
ON CONFLICT (code) DO NOTHING;

-- 4. Retail: Cash Registers
INSERT INTO retail.cash_registers (id, store_id, terminal_code, name)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'POS-REG-01', 'Register 01 (Main POS)'),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'POS-REG-02', 'Register 02 (Express)')
ON CONFLICT (terminal_code) DO NOTHING;

-- 5. Identity: Users
INSERT INTO identity.users (id, organization_id, email, phone, password_hash, full_name, status, assigned_store_id, assigned_facility_id)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'admin@berryfresh.com', '08111000001', '$2a$10$u25YE570Rs4r28jgtBeHqeDlmTpJ7Z90L.G8ELiFAZM.GM6nXUeK2', 'Hendra Wijaya', 'ACTIVE', NULL, NULL),
    ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'cashier@berryfresh.com', '08111000002', '$2a$10$Hb2jrvpUxpMH5lXOIGype.mXFUxHU7rMJYA12PAMHDr9S.VooO4Rq', 'Siti Rahma', 'ACTIVE', 'c0000000-0000-0000-0000-000000000001', NULL),
    ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'manager@berryfresh.com', '08111000003', '$2a$10$bqPvpK7JYaNvFslIoeZo2euxA0AuBB7R1g6ypAgrAmXBFdtL50jfO', 'Dewi Lestari', 'ACTIVE', 'c0000000-0000-0000-0000-000000000001', NULL),
    ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'warehouse@berryfresh.com', '08111000004', '$2a$10$oCyCwdCC4kPRU37FYnOvy.pfXnD5Vj6Hs4qFKCQt70P3AUghlov6O', 'Budi Santoso', 'ACTIVE', NULL, 'b0000000-0000-0000-0000-000000000001'),
    ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'customer@berryfresh.com', '08111000005', '$2a$10$WofgxV3pmHg/OyUW5s9TxuIAiJUxVf/jlNEl0CiW.SDPPSc/RiM2i', 'Rina Kusuma', 'ACTIVE', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

-- User Roles Junction
INSERT INTO identity.user_roles (user_id, role_id)
SELECT u.id, r.id FROM identity.users u, identity.roles r
WHERE (u.email = 'admin@berryfresh.com' AND r.code = 'ADMIN')
   OR (u.email = 'cashier@berryfresh.com' AND r.code = 'CASHIER')
   OR (u.email = 'manager@berryfresh.com' AND r.code = 'MANAGER')
   OR (u.email = 'warehouse@berryfresh.com' AND r.code = 'WAREHOUSE')
   OR (u.email = 'customer@berryfresh.com' AND r.code = 'CUSTOMER')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 6. Catalog: Varieties
INSERT INTO catalog.varieties (id, category_id, code, name, flavor_profile)
SELECT 
    'f0000000-0000-0000-0000-000000000001', c.id, 'ALBION', 'Albion High-Sugar', 'Crisp, aromatic, high sweetness Brix 9°+'
FROM catalog.categories c WHERE c.code = 'BERRIES'
ON CONFLICT (code) DO NOTHING;

INSERT INTO catalog.varieties (id, category_id, code, name, flavor_profile)
SELECT 
    'f0000000-0000-0000-0000-000000000002', c.id, 'SWEET_CHARLIE', 'Sweet Charlie', 'Juicy, soft pulp, medium acidity'
FROM catalog.categories c WHERE c.code = 'BERRIES'
ON CONFLICT (code) DO NOTHING;

INSERT INTO catalog.varieties (id, category_id, code, name, flavor_profile)
SELECT 
    'f0000000-0000-0000-0000-000000000003', c.id, 'DUKE', 'Duke Super-Blue', 'Plump, firm, antioxidant rich, deep indigo bloom'
FROM catalog.categories c WHERE c.code = 'BERRIES'
ON CONFLICT (code) DO NOTHING;

INSERT INTO catalog.varieties (id, category_id, code, name, flavor_profile)
SELECT 
    'f0000000-0000-0000-0000-000000000004', c.id, 'EMERALD', 'Emerald Jumbo', 'Jumbo berries, super sweet, crunchy bite'
FROM catalog.categories c WHERE c.code = 'BERRIES'
ON CONFLICT (code) DO NOTHING;

INSERT INTO catalog.varieties (id, category_id, code, name, flavor_profile)
SELECT 
    'f0000000-0000-0000-0000-000000000005', c.id, 'HERITAGE', 'Heritage Royal', 'Delicate ruby red, aromatic aroma, pleasant tartness'
FROM catalog.categories c WHERE c.code = 'BERRIES'
ON CONFLICT (code) DO NOTHING;

INSERT INTO catalog.varieties (id, category_id, code, name, flavor_profile)
SELECT 
    'f0000000-0000-0000-0000-000000000006', c.id, 'PRIME_ARK', 'Prime-Ark Freedom', 'Thornless cultivar, robust blackberry flavor, juicy'
FROM catalog.categories c WHERE c.code = 'BERRIES'
ON CONFLICT (code) DO NOTHING;

-- 7. Catalog: Products
INSERT INTO catalog.products (id, category_id, variety_id, sku, barcode, plu_code, name, description, primary_uom_id, is_catch_weight, optimum_storage_temp_c, expected_shelf_life_days, image_url)
SELECT 
    '10000000-0000-0000-0000-000000000001', c.id, v.id, 'BF-STR-ALB-250G', '899123456701', '4011',
    'Albion Strawberries (Grade A, 250g Punnet)', 'Sweet hand-picked strawberries from Ciwidey highland in 250g clamshell punnet',
    u.id, FALSE, 2.0, 5, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80'
FROM catalog.categories c, catalog.varieties v, catalog.units_of_measure u
WHERE c.code = 'BERRIES' AND v.code = 'ALBION' AND u.code = 'PUNNET_250'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO catalog.products (id, category_id, variety_id, sku, barcode, plu_code, name, description, primary_uom_id, is_catch_weight, optimum_storage_temp_c, expected_shelf_life_days, image_url)
SELECT 
    '10000000-0000-0000-0000-000000000002', c.id, v.id, 'BF-STR-SWC-KG', '899123456702', '4012',
    'Sweet Charlie Strawberries (Loose Catch-Weight)', 'Fresh loose strawberries weighed at scale station per kilogram / gram',
    u.id, TRUE, 2.5, 4, 'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80'
FROM catalog.categories c, catalog.varieties v, catalog.units_of_measure u
WHERE c.code = 'BERRIES' AND v.code = 'SWEET_CHARLIE' AND u.code = 'KG'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO catalog.products (id, category_id, variety_id, sku, barcode, plu_code, name, description, primary_uom_id, is_catch_weight, optimum_storage_temp_c, expected_shelf_life_days, image_url)
SELECT 
    '10000000-0000-0000-0000-000000000003', c.id, v.id, 'BF-BLU-DUK-125G', '899123456703', '4021',
    'Highland Duke Blueberries (125g Punnet)', 'Batu Highland premium blueberries packed in protective 125g clamshell',
    u.id, FALSE, 1.5, 10, 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=600&q=80'
FROM catalog.categories c, catalog.varieties v, catalog.units_of_measure u
WHERE c.code = 'BERRIES' AND v.code = 'DUKE' AND u.code = 'PUNNET_125'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO catalog.products (id, category_id, variety_id, sku, barcode, plu_code, name, description, primary_uom_id, is_catch_weight, optimum_storage_temp_c, expected_shelf_life_days, image_url)
SELECT 
    '10000000-0000-0000-0000-000000000004', c.id, v.id, 'BF-BLU-EME-250G', '899123456704', '4022',
    'Emerald Blueberries Jumbo (250g Family Pack)', 'Extra large jumbo berries for family snacking in 250g punnet',
    u.id, FALSE, 1.5, 10, 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?auto=format&fit=crop&w=600&q=80'
FROM catalog.categories c, catalog.varieties v, catalog.units_of_measure u
WHERE c.code = 'BERRIES' AND v.code = 'EMERALD' AND u.code = 'PUNNET_250'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO catalog.products (id, category_id, variety_id, sku, barcode, plu_code, name, description, primary_uom_id, is_catch_weight, optimum_storage_temp_c, expected_shelf_life_days, image_url)
SELECT 
    '10000000-0000-0000-0000-000000000005', c.id, v.id, 'BF-RAS-HER-125G', '899123456705', '4031',
    'Heritage Red Raspberries (125g Punnet)', 'Delicate and fragrant red raspberries from Lembang highland',
    u.id, FALSE, 1.0, 4, 'https://images.unsplash.com/photo-1577069808021-766782559595?auto=format&fit=crop&w=600&q=80'
FROM catalog.categories c, catalog.varieties v, catalog.units_of_measure u
WHERE c.code = 'BERRIES' AND v.code = 'HERITAGE' AND u.code = 'PUNNET_125'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO catalog.products (id, category_id, variety_id, sku, barcode, plu_code, name, description, primary_uom_id, is_catch_weight, optimum_storage_temp_c, expected_shelf_life_days, image_url)
SELECT 
    '10000000-0000-0000-0000-000000000006', c.id, v.id, 'BF-BLK-ARK-125G', '899123456706', '4041',
    'Prime-Ark Blackberries (125g Punnet)', 'Sweet and tart blackberries from volcanic highland slopes',
    u.id, FALSE, 1.5, 6, 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&q=80'
FROM catalog.categories c, catalog.varieties v, catalog.units_of_measure u
WHERE c.code = 'BERRIES' AND v.code = 'PRIME_ARK' AND u.code = 'PUNNET_125'
ON CONFLICT (sku) DO NOTHING;

-- Product Prices (Unified Base IDR Cents)
INSERT INTO catalog.product_prices (product_id, channel, base_price_cents, compare_at_price_cents)
SELECT p.id, 'ECOMMERCE', 38000, 45000 FROM catalog.products p WHERE p.sku = 'BF-STR-ALB-250G'
ON CONFLICT (product_id, channel) DO NOTHING;

INSERT INTO catalog.product_prices (product_id, channel, base_price_cents, compare_at_price_cents)
SELECT p.id, 'POS', 38000, 45000 FROM catalog.products p WHERE p.sku = 'BF-STR-ALB-250G'
ON CONFLICT (product_id, channel) DO NOTHING;

INSERT INTO catalog.product_prices (product_id, channel, base_price_cents, compare_at_price_cents)
SELECT p.id, 'POS', 120000, 140000 FROM catalog.products p WHERE p.sku = 'BF-STR-SWC-KG'
ON CONFLICT (product_id, channel) DO NOTHING;

INSERT INTO catalog.product_prices (product_id, channel, base_price_cents, compare_at_price_cents)
SELECT p.id, 'ECOMMERCE', 52000, 60000 FROM catalog.products p WHERE p.sku = 'BF-BLU-DUK-125G'
ON CONFLICT (product_id, channel) DO NOTHING;

INSERT INTO catalog.product_prices (product_id, channel, base_price_cents, compare_at_price_cents)
SELECT p.id, 'POS', 52000, 60000 FROM catalog.products p WHERE p.sku = 'BF-BLU-DUK-125G'
ON CONFLICT (product_id, channel) DO NOTHING;

INSERT INTO catalog.product_prices (product_id, channel, base_price_cents, compare_at_price_cents)
SELECT p.id, 'ECOMMERCE', 85000, 98000 FROM catalog.products p WHERE p.sku = 'BF-BLU-EME-250G'
ON CONFLICT (product_id, channel) DO NOTHING;

INSERT INTO catalog.product_prices (product_id, channel, base_price_cents, compare_at_price_cents)
SELECT p.id, 'POS', 85000, 98000 FROM catalog.products p WHERE p.sku = 'BF-BLU-EME-250G'
ON CONFLICT (product_id, channel) DO NOTHING;

INSERT INTO catalog.product_prices (product_id, channel, base_price_cents, compare_at_price_cents)
SELECT p.id, 'ECOMMERCE', 65000, 75000 FROM catalog.products p WHERE p.sku = 'BF-RAS-HER-125G'
ON CONFLICT (product_id, channel) DO NOTHING;

INSERT INTO catalog.product_prices (product_id, channel, base_price_cents, compare_at_price_cents)
SELECT p.id, 'POS', 65000, 75000 FROM catalog.products p WHERE p.sku = 'BF-RAS-HER-125G'
ON CONFLICT (product_id, channel) DO NOTHING;

INSERT INTO catalog.product_prices (product_id, channel, base_price_cents, compare_at_price_cents)
SELECT p.id, 'ECOMMERCE', 58000, 68000 FROM catalog.products p WHERE p.sku = 'BF-BLK-ARK-125G'
ON CONFLICT (product_id, channel) DO NOTHING;

INSERT INTO catalog.product_prices (product_id, channel, base_price_cents, compare_at_price_cents)
SELECT p.id, 'POS', 58000, 68000 FROM catalog.products p WHERE p.sku = 'BF-BLK-ARK-125G'
ON CONFLICT (product_id, channel) DO NOTHING;

-- 8. Procurement: Suppliers & Farms
INSERT INTO procurement.suppliers (id, code, company_name, contact_name, email, phone, city, rating)
VALUES
    ('80000000-0000-0000-0000-000000000001', 'SUP-CWD-01', 'PT Ciwidey Agro Nusantara', 'Agus Hendra', 'agus@ciwideyagro.id', '08123450001', 'Bandung', 4.90),
    ('80000000-0000-0000-0000-000000000002', 'SUP-LMB-01', 'CV Lembang Highland Fruit', 'Wawan Setiawan', 'wawan@lembangfruit.id', '08123450002', 'Lembang', 4.85),
    ('80000000-0000-0000-0000-000000000003', 'SUP-BATU-01', 'Kelompok Tani Batu Organik', 'Supriyadi', 'supri@batuagro.id', '08123450003', 'Batu', 4.95)
ON CONFLICT (code) DO NOTHING;

INSERT INTO production.farms (id, supplier_id, name, region, altitude_meters, certification)
VALUES
    ('90000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 'Ciwidey Highland Farm Plot 3', 'Bandung Selatan', 1450, 'GlobalG.A.P'),
    ('90000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002', 'Lembang Sunrise Farm', 'Bandung Utara', 1300, 'Organik Indonesia'),
    ('90000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000003', 'Batu Highland Agro', 'Jawa Timur', 1200, 'GlobalG.A.P')
ON CONFLICT DO NOTHING;

-- 9. Traceability: Batches (FEFO Orders)
INSERT INTO traceability.batches (
    id, batch_code, product_id, farm_id, supplier_id, harvest_date, receiving_date, 
    best_before_date, expiry_date, quality_grade, measured_brix, initial_quantity_base, remaining_quantity_base, status
)
SELECT 
    'b1000000-0000-0000-0000-000000000001', 'BF-20261108-STR-01A', p.id,
    '90000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '5 days',
    'GRADE_A', 9.4, 250, 180, 'ACTIVE'
FROM catalog.products p WHERE p.sku = 'BF-STR-ALB-250G'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO traceability.batches (
    id, batch_code, product_id, farm_id, supplier_id, harvest_date, receiving_date, 
    best_before_date, expiry_date, quality_grade, measured_brix, initial_quantity_base, remaining_quantity_base, status
)
SELECT 
    'b1000000-0000-0000-0000-000000000002', 'BF-20261108-STR-02B', p.id,
    '90000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002',
    CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '7 days',
    'GRADE_A', 9.8, 400, 350, 'ACTIVE'
FROM catalog.products p WHERE p.sku = 'BF-STR-ALB-250G'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO traceability.batches (
    id, batch_code, product_id, farm_id, supplier_id, harvest_date, receiving_date, 
    best_before_date, expiry_date, quality_grade, measured_brix, initial_quantity_base, remaining_quantity_base, status
)
SELECT 
    'b1000000-0000-0000-0000-000000000003', 'BF-20261108-SWC-01', p.id,
    '90000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '4 days', CURRENT_DATE + INTERVAL '6 days',
    'GRADE_A', 8.8, 200000, 163700, 'ACTIVE' -- in grams (163.7 kg)
FROM catalog.products p WHERE p.sku = 'BF-STR-SWC-KG'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO traceability.batches (
    id, batch_code, product_id, farm_id, supplier_id, harvest_date, receiving_date, 
    best_before_date, expiry_date, quality_grade, measured_brix, initial_quantity_base, remaining_quantity_base, status
)
SELECT 
    'b1000000-0000-0000-0000-000000000004', 'BF-20261105-BLU-01', p.id,
    '90000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000003',
    CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '3 days',
    CURRENT_DATE + INTERVAL '6 days', CURRENT_DATE + INTERVAL '8 days',
    'GRADE_A', 12.5, 300, 255, 'ACTIVE'
FROM catalog.products p WHERE p.sku = 'BF-BLU-DUK-125G'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO traceability.batches (
    id, batch_code, product_id, farm_id, supplier_id, harvest_date, receiving_date, 
    best_before_date, expiry_date, quality_grade, measured_brix, initial_quantity_base, remaining_quantity_base, status
)
SELECT 
    'b1000000-0000-0000-0000-000000000005', 'BF-20261106-EME-02', p.id,
    '90000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000003',
    CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '9 days',
    'GRADE_A', 13.0, 200, 185, 'ACTIVE'
FROM catalog.products p WHERE p.sku = 'BF-BLU-EME-250G'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO traceability.batches (
    id, batch_code, product_id, farm_id, supplier_id, harvest_date, receiving_date, 
    best_before_date, expiry_date, quality_grade, measured_brix, initial_quantity_base, remaining_quantity_base, status
)
SELECT 
    'b1000000-0000-0000-0000-000000000006', 'BF-20261107-RAS-01', p.id,
    '90000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002',
    CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '5 days',
    'GRADE_A', 9.2, 150, 130, 'ACTIVE'
FROM catalog.products p WHERE p.sku = 'BF-RAS-HER-125G'
ON CONFLICT (batch_code) DO NOTHING;

INSERT INTO traceability.batches (
    id, batch_code, product_id, farm_id, supplier_id, harvest_date, receiving_date, 
    best_before_date, expiry_date, quality_grade, measured_brix, initial_quantity_base, remaining_quantity_base, status
)
SELECT 
    'b1000000-0000-0000-0000-000000000007', 'BF-20261107-BLK-01', p.id,
    '90000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002',
    CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '4 days', CURRENT_DATE + INTERVAL '6 days',
    'GRADE_A', 10.1, 120, 110, 'ACTIVE'
FROM catalog.products p WHERE p.sku = 'BF-BLK-ARK-125G'
ON CONFLICT (batch_code) DO NOTHING;

-- 10. Inventory: Balances in Central Warehouse and Store
-- Warehouse WH-JKT-MAIN balances
INSERT INTO inventory.stock_balances (facility_id, store_id, product_id, batch_id, quantity_on_hand_base, quantity_reserved_base)
SELECT 'b0000000-0000-0000-0000-000000000001', NULL, b.product_id, b.id, 180, 0
FROM traceability.batches b WHERE b.batch_code = 'BF-20261108-STR-01A'
ON CONFLICT DO NOTHING;

INSERT INTO inventory.stock_balances (facility_id, store_id, product_id, batch_id, quantity_on_hand_base, quantity_reserved_base)
SELECT 'b0000000-0000-0000-0000-000000000001', NULL, b.product_id, b.id, 350, 0
FROM traceability.batches b WHERE b.batch_code = 'BF-20261108-STR-02B'
ON CONFLICT DO NOTHING;

INSERT INTO inventory.stock_balances (facility_id, store_id, product_id, batch_id, quantity_on_hand_base, quantity_reserved_base)
SELECT 'b0000000-0000-0000-0000-000000000001', NULL, b.product_id, b.id, 145500, 0 -- 145.5 kg in grams
FROM traceability.batches b WHERE b.batch_code = 'BF-20261108-SWC-01'
ON CONFLICT DO NOTHING;

INSERT INTO inventory.stock_balances (facility_id, store_id, product_id, batch_id, quantity_on_hand_base, quantity_reserved_base)
SELECT 'b0000000-0000-0000-0000-000000000001', NULL, b.product_id, b.id, 220, 0
FROM traceability.batches b WHERE b.batch_code = 'BF-20261105-BLU-01'
ON CONFLICT DO NOTHING;

-- Store STORE-JKT-01 balances
INSERT INTO inventory.stock_balances (facility_id, store_id, product_id, batch_id, quantity_on_hand_base, quantity_reserved_base)
SELECT NULL, 'c0000000-0000-0000-0000-000000000001', b.product_id, b.id, 64, 0
FROM traceability.batches b WHERE b.batch_code = 'BF-20261108-STR-01A'
ON CONFLICT DO NOTHING;

INSERT INTO inventory.stock_balances (facility_id, store_id, product_id, batch_id, quantity_on_hand_base, quantity_reserved_base)
SELECT NULL, 'c0000000-0000-0000-0000-000000000001', b.product_id, b.id, 18200, 0 -- 18.2 kg in grams
FROM traceability.batches b WHERE b.batch_code = 'BF-20261108-SWC-01'
ON CONFLICT DO NOTHING;

INSERT INTO inventory.stock_balances (facility_id, store_id, product_id, batch_id, quantity_on_hand_base, quantity_reserved_base)
SELECT NULL, 'c0000000-0000-0000-0000-000000000001', b.product_id, b.id, 35, 0
FROM traceability.batches b WHERE b.batch_code = 'BF-20261105-BLU-01'
ON CONFLICT DO NOTHING;

-- 11. Initial POS Cashier Shift (Active for testing)
INSERT INTO retail.cashier_shifts (
    id, register_id, cashier_user_id, opened_at, opening_cash_float_cents, 
    total_sales_count, total_sales_amount_cents, status
)
VALUES (
    '50000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000002',
    CURRENT_TIMESTAMP - INTERVAL '4 hours',
    200000,
    14,
    1845000,
    'OPEN'
)
ON CONFLICT DO NOTHING;
