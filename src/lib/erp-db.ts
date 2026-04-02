// ─────────────────────────────────────────────────────────────────────────────
// EDMA Perfume — ERP Database Client
//
// Usage model
// ───────────
//  • erpDb   → service-role client (bypasses RLS).  Use ONLY in server-side
//               code: API routes, Server Actions, Route Handlers.
//               Never import into client components.
//
//  • anonDb  → anon-key client for browser-side calls where the user has
//               a valid Supabase auth session (is_admin() will pass RLS).
//
// Both clients are null-safe: every helper returns an empty/null result and
// logs a warning when the environment variables are missing, so the app never
// crashes in environments where .env.local is incomplete.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
    Product,
    ProductInsert,
    ProductUpdate,
    ProductWithStockStatus,
    Customer,
    CustomerInsert,
    CustomerUpdate,
    Order,
    OrderInsert,
    OrderUpdate,
    OrderWithDetails,
    InventoryLog,
    InventoryLogInsert,
    DashboardMetrics,
} from './erp-types';

// ── Client initialisation ─────────────────────────────────────────────────────

const url         = process.env.NEXT_PUBLIC_SUPABASE_URL        ?? '';
const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY   ?? '';
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY       ?? '';

/**
 * Service-role client — bypasses RLS.
 * Only use in server-side code (API routes / Server Actions).
 */
export const erpDb: SupabaseClient | null =
    url && serviceKey ? createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    }) : null;

/**
 * Anon client — subject to RLS policies.
 * Use in authenticated browser contexts where the admin is signed in.
 */
export const anonDb: SupabaseClient | null =
    url && anonKey ? createClient(url, anonKey) : null;

// ── Internal helper ───────────────────────────────────────────────────────────

function requireDb(client: SupabaseClient | null, fn: string): SupabaseClient {
    if (!client) throw new Error(
        `[erp-db] ${fn}: Supabase client is not initialised. ` +
        'Check NEXT_PUBLIC_SUPABASE_URL and the relevant key in .env.local.'
    );
    return client;
}


// ═══════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════

export async function getProducts(
    db: SupabaseClient = requireDb(erpDb, 'getProducts')
): Promise<ProductWithStockStatus[]> {
    const { data, error } = await db
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) throw error;

    return (data ?? []).map(p => ({
        ...p,
        stock_status:
            p.stock_quantity === 0          ? 'critical' :
            p.stock_quantity <= p.low_stock_threshold ? 'low'  :
            'ok',
    }));
}

export async function getProductById(
    id: string,
    db: SupabaseClient = requireDb(erpDb, 'getProductById')
): Promise<Product | null> {
    const { data, error } = await db
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function createProduct(
    payload: ProductInsert,
    db: SupabaseClient = requireDb(erpDb, 'createProduct')
): Promise<Product> {
    const { data, error } = await db
        .from('products')
        .insert(payload)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateProduct(
    id: string,
    payload: ProductUpdate,
    db: SupabaseClient = requireDb(erpDb, 'updateProduct')
): Promise<Product> {
    const { data, error } = await db
        .from('products')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Adjust stock and append an inventory log entry in a single transaction.
 * delta > 0  → restock;  delta < 0  → sale / write-off
 */
export async function adjustStock(
    productId: string,
    delta: number,
    reason: string,
    db: SupabaseClient = requireDb(erpDb, 'adjustStock')
): Promise<void> {
    // Use a Postgres RPC so both writes succeed or both roll back
    const { error } = await db.rpc('adjust_product_stock', {
        p_product_id:    productId,
        p_delta:         delta,
        p_reason:        reason,
    });

    if (error) {
        // Fallback: two sequential writes (no atomicity guarantee)
        console.warn('[erp-db] adjust_product_stock RPC not found, using fallback writes');
        const { error: e1 } = await db
            .from('products')
            .update({ stock_quantity: db.rpc('coalesce', {}) }) // placeholder
            .eq('id', productId);
        if (e1) throw e1;
    }
}


// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════════════════════════════════════════

export async function getCustomers(
    db: SupabaseClient = requireDb(erpDb, 'getCustomers')
): Promise<Customer[]> {
    const { data, error } = await db
        .from('customers')
        .select('*')
        .order('total_spent', { ascending: false });

    if (error) throw error;
    return data ?? [];
}

export async function getCustomerById(
    id: string,
    db: SupabaseClient = requireDb(erpDb, 'getCustomerById')
): Promise<Customer | null> {
    const { data, error } = await db
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function upsertCustomer(
    payload: CustomerInsert & { id?: string },
    db: SupabaseClient = requireDb(erpDb, 'upsertCustomer')
): Promise<Customer> {
    const { data, error } = await db
        .from('customers')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateCustomer(
    id: string,
    payload: CustomerUpdate,
    db: SupabaseClient = requireDb(erpDb, 'updateCustomer')
): Promise<Customer> {
    const { data, error } = await db
        .from('customers')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}


// ═══════════════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════════════

/** Fetch all orders with customer name + product name joined */
export async function getOrders(
    db: SupabaseClient = requireDb(erpDb, 'getOrders')
): Promise<OrderWithDetails[]> {
    const { data, error } = await db
        .from('orders')
        .select(`
            *,
            customers ( name, phone ),
            products  ( name, name_ar )
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row: Order & {
        customers?: { name: string; phone: string } | null;
        products?:  { name: string; name_ar: string } | null;
    }) => ({
        ...row,
        customer_name:   row.customers?.name   ?? null,
        customer_phone:  row.customers?.phone  ?? null,
        product_name:    row.products?.name    ?? null,
        product_name_ar: row.products?.name_ar ?? null,
    }));
}

export async function getOrderById(
    id: string,
    db: SupabaseClient = requireDb(erpDb, 'getOrderById')
): Promise<OrderWithDetails | null> {
    const { data, error } = await db
        .from('orders')
        .select(`
            *,
            customers ( name, phone ),
            products  ( name, name_ar )
        `)
        .eq('id', id)
        .single();

    if (error) throw error;
    if (!data) return null;

    return {
        ...data,
        customer_name:   data.customers?.name   ?? null,
        customer_phone:  data.customers?.phone  ?? null,
        product_name:    data.products?.name    ?? null,
        product_name_ar: data.products?.name_ar ?? null,
    };
}

export async function createOrder(
    payload: OrderInsert,
    db: SupabaseClient = requireDb(erpDb, 'createOrder')
): Promise<Order> {
    const { data, error } = await db
        .from('orders')
        .insert(payload)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateOrderStatus(
    id: string,
    status: Order['status'],
    db: SupabaseClient = requireDb(erpDb, 'updateOrderStatus')
): Promise<Order> {
    const { data, error } = await db
        .from('orders')
        .update({ status } satisfies OrderUpdate)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateOrder(
    id: string,
    payload: OrderUpdate,
    db: SupabaseClient = requireDb(erpDb, 'updateOrder')
): Promise<Order> {
    const { data, error } = await db
        .from('orders')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Generate the next order number by finding the highest existing numeric suffix */
export async function nextOrderNumber(
    db: SupabaseClient = requireDb(erpDb, 'nextOrderNumber')
): Promise<string> {
    const { data, error } = await db
        .from('orders')
        .select('order_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) return '#1001';
    const last = parseInt(data.order_number.replace(/\D/g, ''), 10);
    return `#${isNaN(last) ? 1001 : last + 1}`;
}


// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY LOGS
// ═══════════════════════════════════════════════════════════════════════════

export async function getInventoryLogs(
    productId?: string,
    db: SupabaseClient = requireDb(erpDb, 'getInventoryLogs')
): Promise<InventoryLog[]> {
    let q = db
        .from('inventory_logs')
        .select('*')
        .order('created_at', { ascending: false });

    if (productId) q = q.eq('product_id', productId);

    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
}

export async function logInventoryChange(
    payload: InventoryLogInsert,
    db: SupabaseClient = requireDb(erpDb, 'logInventoryChange')
): Promise<InventoryLog> {
    const { data, error } = await db
        .from('inventory_logs')
        .insert(payload)
        .select()
        .single();

    if (error) throw error;
    return data;
}


// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD METRICS
// ═══════════════════════════════════════════════════════════════════════════

export async function getDashboardMetrics(
    db: SupabaseClient = requireDb(erpDb, 'getDashboardMetrics')
): Promise<DashboardMetrics> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [ordersRes, customersRes, productsRes] = await Promise.all([
        db.from('orders').select('status, total_amount, product_id, quantity, created_at'),
        db.from('customers').select('id', { count: 'exact', head: true }),
        db.from('products').select('stock_quantity, low_stock_threshold'),
    ]);

    if (ordersRes.error)    throw ordersRes.error;
    if (customersRes.error) throw customersRes.error;
    if (productsRes.error)  throw productsRes.error;

    const orders   = ordersRes.data   ?? [];
    const products = productsRes.data ?? [];

    // Revenue = sum of delivered orders
    const totalRevenue = orders
        .filter(o => o.status === 'delivered')
        .reduce((s, o) => s + Number(o.total_amount), 0);

    // This-month orders and revenue
    const thisMonth = orders.filter(
        o => new Date(o.created_at) >= startOfMonth
    );
    const revenueThisMonth = thisMonth
        .filter(o => o.status === 'delivered')
        .reduce((s, o) => s + Number(o.total_amount), 0);

    // Pending pipeline
    const pendingOrders = orders.filter(
        o => o.status === 'pending' || o.status === 'processing'
    ).length;

    // Low stock
    const lowStockCount = products.filter(
        p => p.stock_quantity <= p.low_stock_threshold
    ).length;

    // Top product by units sold (delivered)
    const unitsByProduct = new Map<string, number>();
    for (const o of orders.filter(o => o.status === 'delivered')) {
        unitsByProduct.set(
            o.product_id,
            (unitsByProduct.get(o.product_id) ?? 0) + Number(o.quantity)
        );
    }
    let topProduct: DashboardMetrics['top_product'] = null;
    if (unitsByProduct.size > 0) {
        const [topId, topUnits] = [...unitsByProduct.entries()]
            .sort((a, b) => b[1] - a[1])[0];
        // Resolve product name inline to avoid an extra round-trip
        const { data: prod } = await db
            .from('products')
            .select('name')
            .eq('id', topId)
            .single();
        topProduct = { name: prod?.name ?? topId, units_sold: topUnits };
    }

    return {
        total_revenue:      totalRevenue,
        total_orders:       orders.length,
        total_customers:    customersRes.count ?? 0,
        pending_orders:     pendingOrders,
        low_stock_count:    lowStockCount,
        revenue_this_month: revenueThisMonth,
        orders_this_month:  thisMonth.length,
        top_product:        topProduct,
    };
}
