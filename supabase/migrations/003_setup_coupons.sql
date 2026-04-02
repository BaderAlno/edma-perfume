-- Migration: 003_setup_coupons.sql
-- Description: Upgrades existing coupons table and links coupons to orders

-- 1. Upgrade coupons table
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS applicable_product_ids UUID[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Upgrade orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0;
