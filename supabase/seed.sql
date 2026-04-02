-- ═══════════════════════════════════════════════════════════════════════════
-- EDMA Perfume — ERP Seed Data
-- Run AFTER 001_erp_schema.sql
-- Uses fixed UUIDs so the file is safe to re-run with ON CONFLICT DO NOTHING
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PRODUCTS  (5 fragrances)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO products (id, name, name_ar, price, stock_quantity, low_stock_threshold, image_url)
VALUES
    -- Healthy stock
    ('11111111-1111-1111-1111-000000000001', 'Elinor', 'إلينور', 450.00, 48, 10, '/new_elinor.png'),
    -- At threshold — warning state
    ('11111111-1111-1111-1111-000000000002', 'Velour', 'فيلور',  380.00, 10, 10, '/new_VELOUR.jpg'),
    -- Below threshold — alert state
    ('11111111-1111-1111-1111-000000000003', 'Cecily', 'سيسيلي', 320.00,  7, 10, '/new_CECLIY.jpg'),
    -- New arrival, healthy
    ('11111111-1111-1111-1111-000000000004', 'Layla',  'ليلى',   420.00, 30, 10, NULL),
    -- Critical — almost out of stock
    ('11111111-1111-1111-1111-000000000005', 'Khumra', 'خمرة',   350.00,  3, 10, NULL)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CUSTOMERS  (5 Saudi customers)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO customers (id, name, phone, email, city, country, total_orders, total_spent)
VALUES
    ('22222222-2222-2222-2222-000000000001', 'Sara Al-Rashidi',  '+966501234567', 'sara@example.com',  'Riyadh', 'SA', 3, 1350.00),
    ('22222222-2222-2222-2222-000000000002', 'Nour Al-Hamdan',   '+966512345678', 'nour@example.com',  'Jeddah', 'SA', 2,  760.00),
    ('22222222-2222-2222-2222-000000000003', 'Hessa Al-Qahtani', '+966523456789', 'hessa@example.com', 'Dammam', 'SA', 2,  740.00),
    ('22222222-2222-2222-2222-000000000004', 'Maha Al-Otaibi',   '+966534567890', 'maha@example.com',  'Mecca',  'SA', 1,  380.00),
    ('22222222-2222-2222-2222-000000000005', 'Rana Al-Dossari',  '+966545678901', 'rana@example.com',  'Medina', 'SA', 2,  870.00)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ORDERS  (10 orders, mixed statuses and channels)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO orders (order_number, customer_id, product_id, quantity, total_amount, status, source, notes, created_at)
VALUES
    -- ── Delivered ──────────────────────────────────────────────────────────
    ('#1041',
     '22222222-2222-2222-2222-000000000001',   -- Sara
     '11111111-1111-1111-1111-000000000001',   -- Elinor
     1, 450.00, 'delivered', 'website',   NULL,
     now() - interval '30 days'),

    ('#1042',
     '22222222-2222-2222-2222-000000000002',   -- Nour
     '11111111-1111-1111-1111-000000000002',   -- Velour ×2
     2, 760.00, 'delivered', 'instagram', NULL,
     now() - interval '25 days'),

    ('#1043',
     '22222222-2222-2222-2222-000000000003',   -- Hessa
     '11111111-1111-1111-1111-000000000003',   -- Cecily
     1, 320.00, 'delivered', 'whatsapp',  NULL,
     now() - interval '20 days'),

    ('#1044',
     '22222222-2222-2222-2222-000000000001',   -- Sara
     '11111111-1111-1111-1111-000000000004',   -- Layla
     1, 420.00, 'delivered', 'website',   NULL,
     now() - interval '18 days'),

    -- ── Shipped ─────────────────────────────────────────────────────────────
    ('#1045',
     '22222222-2222-2222-2222-000000000004',   -- Maha
     '11111111-1111-1111-1111-000000000002',   -- Velour
     1, 380.00, 'shipped',   'instagram', NULL,
     now() - interval '12 days'),

    ('#1046',
     '22222222-2222-2222-2222-000000000003',   -- Hessa
     '11111111-1111-1111-1111-000000000004',   -- Layla
     1, 420.00, 'shipped',   'whatsapp',  NULL,
     now() - interval '9 days'),

    -- ── Processing ──────────────────────────────────────────────────────────
    ('#1047',
     '22222222-2222-2222-2222-000000000005',   -- Rana
     '11111111-1111-1111-1111-000000000001',   -- Elinor ×2
     2, 900.00, 'processing','website',   'Gift wrapping requested',
     now() - interval '5 days'),

    ('#1048',
     '22222222-2222-2222-2222-000000000002',   -- Nour
     '11111111-1111-1111-1111-000000000005',   -- Khumra
     1, 350.00, 'processing','instagram', NULL,
     now() - interval '4 days'),

    -- ── Pending ─────────────────────────────────────────────────────────────
    ('#1049',
     '22222222-2222-2222-2222-000000000001',   -- Sara
     '11111111-1111-1111-1111-000000000005',   -- Khumra
     1, 350.00, 'pending',   'whatsapp',  NULL,
     now() - interval '2 days'),

    ('#1050',
     '22222222-2222-2222-2222-000000000005',   -- Rana
     '11111111-1111-1111-1111-000000000003',   -- Cecily
     1, 320.00, 'pending',   'website',   'Express delivery — call before dispatch',
     now() - interval '1 day')

ON CONFLICT (order_number) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. INVENTORY LOGS  (opening stock + movements)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO inventory_logs (product_id, change_amount, reason, created_at)
VALUES
    -- Opening stock
    ('11111111-1111-1111-1111-000000000001',  50, 'Initial stock — Elinor',  now() - interval '60 days'),
    ('11111111-1111-1111-1111-000000000002',  20, 'Initial stock — Velour',  now() - interval '60 days'),
    ('11111111-1111-1111-1111-000000000003',  15, 'Initial stock — Cecily',  now() - interval '60 days'),
    ('11111111-1111-1111-1111-000000000004',  30, 'Initial stock — Layla',   now() - interval '30 days'),
    ('11111111-1111-1111-1111-000000000005',  10, 'Initial stock — Khumra',  now() - interval '30 days'),

    -- Sales reductions (matching delivered + shipped orders above)
    ('11111111-1111-1111-1111-000000000001',  -2, 'Orders #1041, #1044',     now() - interval '15 days'),
    ('11111111-1111-1111-1111-000000000002',  -3, 'Orders #1042, #1045',     now() - interval '10 days'),
    ('11111111-1111-1111-1111-000000000003',  -2, 'Orders #1043, reduction', now() - interval '18 days'),
    ('11111111-1111-1111-1111-000000000004',  -1, 'Order #1044',             now() - interval '16 days'),
    ('11111111-1111-1111-1111-000000000005',  -7, 'Prior sales — Khumra',    now() - interval  '5 days');
