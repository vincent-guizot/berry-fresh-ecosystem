-- ========================================================
-- BERRY FRESH CORE — MIGRATION 000001: 16 DOMAIN SCHEMAS
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Identity & RBAC
CREATE SCHEMA IF NOT EXISTS identity;

-- 2. Organization & Governance
CREATE SCHEMA IF NOT EXISTS governance;

-- 3. Upstream Farm & Harvest Production
CREATE SCHEMA IF NOT EXISTS production;

-- 4. Product Catalog & Taxonomy
CREATE SCHEMA IF NOT EXISTS catalog;

-- 5. Procurement & Suppliers
CREATE SCHEMA IF NOT EXISTS procurement;

-- 6. Batch Provenance & Quality Traceability
CREATE SCHEMA IF NOT EXISTS traceability;

-- 7. Cold-Chain Warehouse & Inventory Balances
CREATE SCHEMA IF NOT EXISTS inventory;

-- 8. Logistics & Expeditions
CREATE SCHEMA IF NOT EXISTS logistics;

-- 9. E-Commerce & Customer Orders
CREATE SCHEMA IF NOT EXISTS commerce;

-- 10. Physical Store & POS Retail
CREATE SCHEMA IF NOT EXISTS retail;

-- 11. Finance, Ledger & Reconciliation
CREATE SCHEMA IF NOT EXISTS finance;

-- 12. Messaging & Support Communication
CREATE SCHEMA IF NOT EXISTS communication;

-- 13. Content Management (CMS)
CREATE SCHEMA IF NOT EXISTS content;

-- 14. Dimensional Analytics (Star Schema)
CREATE SCHEMA IF NOT EXISTS analytics;

-- 15. External Partner Integrations
CREATE SCHEMA IF NOT EXISTS integration;

-- 16. Audit Trails, Transactional Outbox & Inbox
CREATE SCHEMA IF NOT EXISTS audit;
