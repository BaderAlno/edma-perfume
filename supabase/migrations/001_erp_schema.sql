-- ═══════════════════════════════════════════════════════════════════════════
-- EDMA Perfume — Complete ERP Schema
-- Paste into Supabase SQL Editor and run in one shot.
-- ═══════════════════════════════════════════════════════════════════════════

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
    id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    name          text          NOT NULL,
    phone         text,
    email         text,
    city          text,
    country       text          NOT NULL DEFAULT 'SA',
    total_orders  integer       NOT NULL DEFAULT 0,
    total_spent   numeric(12,2) NOT NULL DEFAULT 0,
    notes         text,
    created_at    timestamptz   NOT NULL DEFAULT now()
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

CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS orders_set_updated_at ON orders;
CREATE TRIGGER orders_set_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. COUPONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    code        text        UNIQUE NOT NULL,
    type        coupon_type NOT NULL DEFAULT 'percentage',
    value       numeric(10,2) NOT NULL CHECK (value > 0),
    min_order   numeric(10,2),
    max_uses    integer,
    uses_count  integer     NOT NULL DEFAULT 0,
    expires_at  timestamptz,
    is_active   boolean     NOT NULL DEFAULT true
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
    change_amount integer     NOT NULL,
    reason        text,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_customer    ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_product     ON orders (product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created     ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_logs_product   ON inventory_logs (product_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone    ON customers (phone);
CREATE INDEX IF NOT EXISTS idx_notif_is_read      ON notifications (is_read) WHERE is_read = false;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- admin_users allowlist
CREATE TABLE IF NOT EXISTS admin_users (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- is_admin() — security definer, no RLS recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid());
$$;

-- One policy per table (FOR ALL = select + insert + update + delete)
CREATE POLICY "admin_all" ON products       FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all" ON customers      FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all" ON orders         FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all" ON coupons        FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all" ON notifications  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all" ON inventory_logs FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all" ON admin_users    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Public read on products (storefront)
CREATE POLICY "public_read_active_products" ON products
    FOR SELECT USING (is_active = true);

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED  ── 5 products + 5 customers + 10 orders + inventory logs
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO products (id, name, name_ar, price, stock_quantity, low_stock_threshold, image_url, is_active)
VALUES
    ('11111111-1111-1111-1111-000000000001','Elinor','إلينور', 450.00, 48, 10, '/new_elinor.png',  true),
    ('11111111-1111-1111-1111-000000000002','Velour','فيلور',  380.00, 10, 10, '/new_VELOUR.jpg',  true),
    ('11111111-1111-1111-1111-000000000003','Cecily','سيسيلي', 320.00,  7, 10, '/new_CECLIY.jpg',  true),
    ('11111111-1111-1111-1111-000000000004','Layla', 'ليلى',   420.00, 30, 10, NULL,               true),
    ('11111111-1111-1111-1111-000000000005','Khumra','خمرة',   350.00,  3, 10, NULL,               true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO customers (id, name, phone, email, city, total_orders, total_spent)
VALUES
    ('22222222-2222-2222-2222-000000000001','Sara Al-Rashidi',  '+966501234567','sara@example.com',  'Riyadh', 3, 1350.00),
    ('22222222-2222-2222-2222-000000000002','Nour Al-Hamdan',   '+966512345678','nour@example.com',  'Jeddah', 2,  760.00),
    ('22222222-2222-2222-2222-000000000003','Hessa Al-Qahtani', '+966523456789','hessa@example.com', 'Dammam', 2,  740.00),
    ('22222222-2222-2222-2222-000000000004','Maha Al-Otaibi',   '+966534567890','maha@example.com',  'Mecca',  1,  380.00),
    ('22222222-2222-2222-2222-000000000005','Rana Al-Dossari',  '+966545678901','rana@example.com',  'Medina', 2,  870.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (order_number, customer_id, product_id, quantity, total_amount, status, source, notes, created_at) VALUES
    ('#1041','22222222-2222-2222-2222-000000000001','11111111-1111-1111-1111-000000000001',1, 450.00,'delivered',  'website',   NULL,                            now()-'30 days'::interval),
    ('#1042','22222222-2222-2222-2222-000000000002','11111111-1111-1111-1111-000000000002',2, 760.00,'delivered',  'instagram', NULL,                            now()-'25 days'::interval),
    ('#1043','22222222-2222-2222-2222-000000000003','11111111-1111-1111-1111-000000000003',1, 320.00,'delivered',  'whatsapp',  NULL,                            now()-'20 days'::interval),
    ('#1044','22222222-2222-2222-2222-000000000001','11111111-1111-1111-1111-000000000004',1, 420.00,'delivered',  'website',   NULL,                            now()-'18 days'::interval),
    ('#1045','22222222-2222-2222-2222-000000000004','11111111-1111-1111-1111-000000000002',1, 380.00,'shipped',    'instagram', NULL,                            now()-'12 days'::interval),
    ('#1046','22222222-2222-2222-2222-000000000003','11111111-1111-1111-1111-000000000004',1, 420.00,'shipped',    'whatsapp',  NULL,                            now()-'9 days'::interval),
    ('#1047','22222222-2222-2222-2222-000000000005','11111111-1111-1111-1111-000000000001',2, 900.00,'processing', 'website',   'Gift wrapping requested',       now()-'5 days'::interval),
    ('#1048','22222222-2222-2222-2222-000000000002','11111111-1111-1111-1111-000000000005',1, 350.00,'processing', 'instagram', NULL,                            now()-'4 days'::interval),
    ('#1049','22222222-2222-2222-2222-000000000001','11111111-1111-1111-1111-000000000005',1, 350.00,'pending',    'whatsapp',  NULL,                            now()-'2 days'::interval),
    ('#1050','22222222-2222-2222-2222-000000000005','11111111-1111-1111-1111-000000000003',1, 320.00,'pending',    'website',   'Express delivery — call first', now()-'1 day'::interval)
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO inventory_logs (product_id, change_amount, reason, created_at) VALUES
    ('11111111-1111-1111-1111-000000000001', 50, 'Initial stock',        now()-'60 days'::interval),
    ('11111111-1111-1111-1111-000000000002', 20, 'Initial stock',        now()-'60 days'::interval),
    ('11111111-1111-1111-1111-000000000003', 15, 'Initial stock',        now()-'60 days'::interval),
    ('11111111-1111-1111-1111-000000000004', 30, 'Initial stock',        now()-'30 days'::interval),
    ('11111111-1111-1111-1111-000000000005', 10, 'Initial stock',        now()-'30 days'::interval),
    ('11111111-1111-1111-1111-000000000001', -2, 'Orders #1041, #1044', now()-'15 days'::interval),
    ('11111111-1111-1111-1111-000000000002', -3, 'Orders #1042, #1045', now()-'10 days'::interval),
    ('11111111-1111-1111-1111-000000000003', -2, 'Orders #1043, #1049', now()-'8 days'::interval),
    ('11111111-1111-1111-1111-000000000005', -7, 'Prior sales',         now()-'5 days'::interval);

-- ─────────────────────────────────────────────────────────────────────────────
-- FIRST ADMIN USER — replace the UUID after creating your Supabase auth user
-- INSERT INTO admin_users (user_id) VALUES ('<your-supabase-user-uuid>');
-- ─────────────────────────────────────────────────────────────────────────────
