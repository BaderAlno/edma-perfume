'use server';

import { supabaseAdmin, pushNotification } from '@/lib/supabase-admin';

// ── Types ─────────────────────────────────────────────────────────────────────

export type StockStatus = 'ok' | 'low' | 'critical' | 'out';

export interface InventoryProduct {
    id:                  string;
    name:                string;
    name_ar:             string;
    stock_quantity:      number;
    low_stock_threshold: number;
    image_url:           string | null;
    stock_status:        StockStatus;
}

export interface InventoryLog {
    id:              string;
    product_id:      string | null;
    product_name:    string;
    product_name_ar: string;
    change_amount:   number;
    reason:          string | null;
    balance_after:   number | null;
    created_at:      string;
}

export interface AdjustStockInput {
    productId: string;
    amount:    number;   // positive = add, negative = subtract
    reason:    string;
}

export interface GetInventoryLogsFilters {
    productId?: string;
    dateFrom?:  string;   // ISO date e.g. '2025-01-01'
    dateTo?:    string;
    page?:      number;
    limit?:     number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveStockStatus(qty: number, threshold: number): StockStatus {
    if (qty === 0)          return 'out';
    if (qty < threshold)    return 'critical';
    if (qty < threshold * 2) return 'low';
    return 'ok';
}

// ── Actions ───────────────────────────────────────────────────────────────────

/** Fetch all active products with stock status derived from thresholds. */
export async function getInventoryStatus(): Promise<InventoryProduct[]> {
    const { data, error } = await supabaseAdmin
        .from('products')
        .select('id, name, name_ar, stock_quantity, low_stock_threshold, image_url')
        .eq('is_active', true)
        .order('name');

    if (error) throw new Error(error.message);

    return (data ?? []).map(p => ({
        id:                  p.id,
        name:                p.name,
        name_ar:             p.name_ar,
        stock_quantity:      Number(p.stock_quantity),
        low_stock_threshold: Number(p.low_stock_threshold),
        image_url:           p.image_url ?? null,
        stock_status:        deriveStockStatus(Number(p.stock_quantity), Number(p.low_stock_threshold)),
    }));
}

/**
 * Adjust stock for a product (positive = add, negative = subtract).
 * Updates products.stock_quantity and inserts into inventory_logs.
 * Pushes a notification if stock drops to zero or below threshold.
 */
export async function adjustStock(input: AdjustStockInput): Promise<void> {
    const { productId, amount, reason } = input;

    if (amount === 0) throw new Error('الكمية يجب أن تكون أكبر من صفر');

    // 1. Fetch current stock
    const { data: product, error: fetchErr } = await supabaseAdmin
        .from('products')
        .select('stock_quantity, low_stock_threshold, name, name_ar')
        .eq('id', productId)
        .single();

    if (fetchErr || !product) throw new Error('المنتج غير موجود');

    const currentQty = Number(product.stock_quantity);
    const threshold  = Number(product.low_stock_threshold);
    const newQty     = currentQty + amount;

    if (newQty < 0) {
        throw new Error(`الكمية المطلوبة (${Math.abs(amount)}) أكبر من المخزون المتاح (${currentQty})`);
    }

    // 2. Update stock
    const { error: updateErr } = await supabaseAdmin
        .from('products')
        .update({ stock_quantity: newQty })
        .eq('id', productId);

    if (updateErr) throw new Error(updateErr.message);

    // 3. Log the change (balance_after requires the SQL migration to have been run)
    await supabaseAdmin
        .from('inventory_logs')
        .insert({
            product_id:    productId,
            change_amount: amount,
            reason,
            balance_after: newQty,
        } as any);

    // 4. Notify on low/out stock
    const displayName = product.name_ar || product.name;
    if (newQty === 0) {
        await pushNotification('نفد المخزون', `نفد مخزون ${displayName} بالكامل`, 'stock');
    } else if (newQty < threshold) {
        await pushNotification(
            'مخزون منخفض',
            `مخزون ${displayName} منخفض — ${newQty} قطعة متبقية`,
            'stock',
        );
    }
}

/**
 * Fetch inventory log entries with optional filters.
 * Requires inventory_logs.balance_after column (see SQL migration).
 */
export async function getInventoryLogs(
    filters?: GetInventoryLogsFilters
): Promise<{ logs: InventoryLog[]; total: number }> {
    const { productId, dateFrom, dateTo, page = 1, limit = 30 } = filters ?? {};
    const from = (page - 1) * limit;

    let q = supabaseAdmin
        .from('inventory_logs')
        .select(
            `id, product_id, change_amount, reason, balance_after, created_at,
             products ( name, name_ar )`,
            { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

    if (productId) q = q.eq('product_id', productId);
    if (dateFrom)  q = q.gte('created_at', dateFrom);
    if (dateTo)    q = q.lte('created_at', dateTo + 'T23:59:59Z');

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    const logs: InventoryLog[] = (data ?? []).map((l: any) => ({
        id:              l.id,
        product_id:      l.product_id,
        product_name:    l.products?.name    ?? '—',
        product_name_ar: l.products?.name_ar ?? '—',
        change_amount:   Number(l.change_amount),
        reason:          l.reason ?? null,
        balance_after:   l.balance_after != null ? Number(l.balance_after) : null,
        created_at:      l.created_at,
    }));

    return { logs, total: count ?? 0 };
}
