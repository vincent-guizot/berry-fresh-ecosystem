-- ========================================================
-- BERRY FRESH CORE — MIGRATION 000002: IDENTITY & GOVERNANCE
-- ========================================================

-- Organizations (Hierarchical Enterprise root)
CREATE TABLE IF NOT EXISTS governance.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'IDR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facilities (Central Warehouses, Cold Storage Hubs, Packhouses, Farms)
CREATE TABLE IF NOT EXISTS governance.facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES governance.organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(50) NOT NULL CHECK (facility_type IN ('WAREHOUSE', 'COLD_STORAGE', 'PACKHOUSE', 'FARM', 'DISTRIBUTION_HUB')),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retail Stores (Physical Brick-and-Mortar POS Locations)
CREATE TABLE IF NOT EXISTS governance.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES governance.organizations(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES governance.facilities(id) ON DELETE SET NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Identity Roles
CREATE TABLE IF NOT EXISTS identity.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS identity.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES governance.organizations(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    assigned_store_id UUID REFERENCES governance.stores(id) ON DELETE SET NULL,
    assigned_facility_id UUID REFERENCES governance.facilities(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles Junction
CREATE TABLE IF NOT EXISTS identity.user_roles (
    user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES identity.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Permissions
CREATE TABLE IF NOT EXISTS identity.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role Permissions Junction
CREATE TABLE IF NOT EXISTS identity.role_permissions (
    role_id UUID NOT NULL REFERENCES identity.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES identity.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Seed System Default Roles
INSERT INTO identity.roles (code, name, description) VALUES
    ('OWNER', 'Enterprise Owner', 'Full unrestricted enterprise-wide access'),
    ('ADMIN', 'System Administrator', 'Operations administration, catalog, and governance management'),
    ('MANAGER', 'Operations Manager', 'Facility/Store operational oversight, approvals, and reports'),
    ('FARMER', 'Farm & Harvest Operator', 'Agricultural harvest logging and yield reporting'),
    ('PROCUREMENT', 'Procurement Specialist', 'Supplier management and purchase orders'),
    ('WAREHOUSE', 'Warehouse & Cold Storage Specialist', 'Receiving, batch inspection, and FEFO picking'),
    ('LOGISTICS', 'Logistics & Fleet Driver', 'Shipment transit and proof of delivery'),
    ('CASHIER', 'Retail Store Cashier', 'Point of sale transactions, register shifts, and receipts'),
    ('CUSTOMER', 'Shop Customer', 'Self-service e-commerce ordering and review'),
    ('SUPPORT', 'Customer Support Representative', 'Inquiries, returns, and support ticketing')
ON CONFLICT (code) DO NOTHING;
