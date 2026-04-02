// ─────────────────────────────────────────────────────────────────────────────
// supabase-admin.ts — server-side only client (bypasses RLS)
// NEVER import this file in a client component or expose it to the browser.
// Use in: API Route Handlers, Server Actions, middleware.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url        = process.env.NEXT_PUBLIC_SUPABASE_URL   ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY  ?? '';

if (!url || !serviceKey) {
    console.warn(
        '[supabase-admin] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. ' +
        'Server-side admin operations will fail.'
    );
}

/**
 * Service-role Supabase client.
 * • Bypasses all RLS policies.
 * • Persistent session disabled — safe for stateless server use.
 */
// Fallback placeholders prevent createClient from throwing at build time when
// env vars are missing; runtime calls will fail with auth errors instead.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAdmin = createClient<any>(
    url        || 'https://placeholder.supabase.co',
    serviceKey || 'placeholder-service-key',
    {
        auth: {
            persistSession:   false,
            autoRefreshToken: false,
        },
    },
);

// ── Convenience helpers ───────────────────────────────────────────────────────

/** Generate next order number by reading the latest order's suffix */
export async function generateOrderNumber(): Promise<string> {
    const { data } = await supabaseAdmin
        .from('orders')
        .select('order_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!data?.order_number) return '#1001';
    const n = parseInt(data.order_number.replace(/\D/g, ''), 10);
    return `#${isNaN(n) ? 1001 : n + 1}`;
}

/** Push a notification visible in the admin bell */
export async function pushNotification(
    title: string,
    body: string,
    type: Database['public']['Enums']['notif_type'] = 'system'
): Promise<void> {
    await supabaseAdmin.from('notifications').insert({ title, body, type });
}

/** Decrement product stock and append an inventory log entry */
export async function deductStock(
    productId: string,
    qty: number,
    reason: string
): Promise<{ ok: boolean; error?: string }> {
    const { data: product, error: fetchErr } = await supabaseAdmin
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

    if (fetchErr || !product) return { ok: false, error: 'Product not found' };
    if (product.stock_quantity < qty) return { ok: false, error: 'Insufficient stock' };

    const { error: updateErr } = await supabaseAdmin
        .from('products')
        .update({ stock_quantity: product.stock_quantity - qty })
        .eq('id', productId);

    if (updateErr) return { ok: false, error: updateErr.message };

    await supabaseAdmin
        .from('inventory_logs')
        .insert({ product_id: productId, change_amount: -qty, reason });

    return { ok: true };
}
