-- ═══════════════════════════════════════════════════════════════════════════════
-- EDMA Perfume — ERP Schema
-- Paste this entire file into the Supabase SQL Editor and click "Run".
-- After running, also run seed.sql to populate sample data.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending','processing','shipped','delivered','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE order_source AS ENUM ('website','whatsapp','instagram');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE coupon_type AS ENUM ('percentage','fixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE notif_type AS ENUM ('order','stock','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PRODUCTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
    id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    name                text          NOT NULL,
    name_ar             text          NOT NULL DEFAULT '',
    description_en      text,
    description_ar      text,
    price               numeric(10,2) NOT NULL CHECK (price >= 0),
    stock_quantity      integer       NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold integer       NOT NULL DEFAULT 10,
    image_url           text,
    is_active           boolean       NOT NULL DEFAULT true,
    created_at          timestamptz   NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CUSTOMERS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
    id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    name           text          NOT NULL,
    phone          text,
    email          text,
    city           text,
    country        text          NOT NULL DEFAULT 'SA',
    total_orders   integer       NOT NULL DEFAULT 0,
    total_spent    numeric(12,2) NOT NULL DEFAULT 0,
    notes          text,
    segment        text          NOT NULL DEFAULT 'inactive'
                                 CHECK (segment IN ('vip','active','inactive')),
    last_order_at  timestamptz,
    created_at     timestamptz   NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ORDERS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
    id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number  text          UNIQUE NOT NULL,
    customer_id   uuid          REFERENCES customers(id) ON DELETE SET NULL,
    product_id    uuid          REFERENCES products(id)  ON DELETE SET NULL,
    quantity      integer       NOT NULL DEFAULT 1 CHECK (quantity > 0),
    total_amount  numeric(10,2) NOT NULL CHECK (total_amount >= 0),
    status        order_status  NOT NULL DEFAULT 'pending',
    source        order_source  NOT NULL DEFAULT 'website',
    notes         text,
    created_at    timestamptz   NOT NULL DEFAULT now(),
    updated_at    timestamptz   NOT NULL DEFAULT now()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_set_updated_at ON orders;
CREATE TRIGGER orders_set_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. COUPONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS coupons (
    id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    code        text          UNIQUE NOT NULL,
    type        coupon_type   NOT NULL DEFAULT 'percentage',
    value       numeric(10,2) NOT NULL CHECK (value > 0),
    min_order   numeric(10,2),                     -- minimum cart total to apply
    max_uses    integer,                            -- NULL = unlimited
    uses_count  integer       NOT NULL DEFAULT 0,
    expires_at  timestamptz,
    is_active   boolean       NOT NULL DEFAULT true
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title      text        NOT NULL,
    body       text,
    type       notif_type  NOT NULL DEFAULT 'system',
    is_read    boolean     NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. INVENTORY LOGS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inventory_logs (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id    uuid        REFERENCES products(id) ON DELETE CASCADE,
    change_amount integer     NOT NULL,             -- positive = stock in, negative = out
    reason        text,
    balance_after integer,                          -- snapshot of stock_quantity after change
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_orders_customer   ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_product    ON orders (product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created    ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_logs_product  ON inventory_logs (product_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone   ON customers (phone);
CREATE INDEX IF NOT EXISTS idx_notif_unread      ON notifications (is_read) WHERE is_read = false;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- ── Admin allowlist table ─────────────────────────────────────────────────────
-- One row per admin Supabase Auth user.
-- After running this schema, insert your user's UUID:
--   INSERT INTO admin_users (user_id) VALUES ('<your-supabase-auth-uuid>');

CREATE TABLE IF NOT EXISTS admin_users (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ── Helper: is the current JWT an admin? ─────────────────────────────────────
-- SECURITY DEFINER prevents RLS recursion on admin_users itself.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    );
$$;

-- ── Policies: admins can do everything ───────────────────────────────────────

CREATE POLICY "admin_all" ON products       FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all" ON customers      FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all" ON orders         FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all" ON coupons        FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all" ON notifications  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all" ON inventory_logs FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all" ON admin_users    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── Public storefront: read active products without auth ─────────────────────

CREATE POLICY "public_read_active_products" ON products
    FOR SELECT USING (is_active = true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- NEXT STEP
-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Run this file in the Supabase SQL Editor.
-- 2. Run supabase/seed.sql to load sample products, customers, and orders.
-- 3. Create a user in Supabase Auth (Dashboard → Authentication → Users).
-- 4. Insert that user's UUID into admin_users:
--      INSERT INTO admin_users (user_id) VALUES ('<uuid-from-auth-dashboard>');
-- ═══════════════════════════════════════════════════════════════════════════════
