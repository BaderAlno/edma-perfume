'use server';

import { supabaseAdmin, generateOrderNumber, pushNotification, deductStock } from '@/lib/supabase-admin';
import type { Database }                from '@/lib/database.types';
import type { OrderWithDetails }        from '@/lib/database.types';

// ── Read helpers (used by server components) ──────────────────────────────────
export async function getOrders(opts?: {
    status?: string;
    source?: string;
    search?: string;
    page?:   number;
    limit?:  number;
}): Promise<{ orders: OrderWithDetails[]; total: number }> {
    const { status, source, search, page = 1, limit = 20 } = opts ?? {};

    let q = supabaseAdmin
        .from('orders')
        .select(`
            id, order_number, quantity, total_amount, status, source,
            created_at, notes, updated_at, customer_id, product_id,
            customers ( name, phone ),
            products  ( name, name_ar )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

    if (status) q = q.eq('status', status as any);
    if (source) q = q.eq('source', source as any);

    if (search) {
        // search by order_number, customer name (via raw filter)
        q = q.or(`order_number.ilike.%${search}%`);
    }

    const { data, error, count } = await q;
    if (error) throw error;

    const orders: OrderWithDetails[] = (data ?? []).map(o => ({
        id:           o.id,
        order_number: o.order_number,
        customer_id:  o.customer_id,
        product_id:   o.product_id,
        quantity:     o.quantity,
        total_amount: Number(o.total_amount),
        status:       o.status,
        source:       o.source,
        notes:        o.notes,
        created_at:   o.created_at,
        updated_at:   o.updated_at,
        customer_name:   (o.customers as any)?.name   ?? null,
        customer_phone:  (o.customers as any)?.phone  ?? null,
        product_name:    (o.products  as any)?.name   ?? null,
        product_name_ar: (o.products  as any)?.name_ar ?? null,
    }));

    return { orders, total: count ?? 0 };
}

// ── Mutations ────────────────────────────────────────────────────────────────

export interface CreateOrderInput {
    customer_id: string;
    product_id:  string;
    quantity:    number;
    total_amount: number;
    source:      'website' | 'whatsapp' | 'instagram';
    notes?:      string;
}

export async function createOrder(input: CreateOrderInput) {
    const order_number = await generateOrderNumber();

    // Deduct stock
    const stock = await deductStock(input.product_id, input.quantity, 'sale');
    if (!stock.ok) throw new Error(stock.error ?? 'فشل خصم المخزون');

    const { data, error } = await supabaseAdmin
        .from('orders')
        .insert({
            ...input,
            order_number,
            status: 'pending',
        })
        .select('id, order_number')
        .single();

    if (error) throw error;

    // Notify
    await pushNotification(
        'طلب جديد',
        `طلب #${order_number} تم إنشاؤه`,
        'order',
    );

    return data;
}

export async function updateOrderStatus(
    orderId: string,
    status: Database['public']['Enums']['order_status'],
) {
    const { error } = await supabaseAdmin
        .from('orders')
        .update({ status })
        .eq('id', orderId);

    if (error) throw error;
}

export async function deleteOrder(orderId: string) {
    const { error } = await supabaseAdmin
        .from('orders')
        .delete()
        .eq('id', orderId);

    if (error) throw error;
}

export async function exportOrdersCSV(opts?: {
    status?: string;
    source?: string;
}): Promise<string> {
    let q = supabaseAdmin
        .from('orders')
        .select(`
            order_number, total_amount, status, source, quantity,
            created_at, notes,
            customers ( name, phone ),
            products  ( name )
        `)
        .order('created_at', { ascending: false });

    if (opts?.status) q = q.eq('status', opts.status as any);
    if (opts?.source) q = q.eq('source', opts.source as any);

    const { data, error } = await q;
    if (error) throw error;

    const rows = (data ?? []).map(o => [
        o.order_number,
        (o.customers as any)?.name ?? '',
        (o.customers as any)?.phone ?? '',
        (o.products  as any)?.name ?? '',
        o.quantity,
        Number(o.total_amount).toFixed(2),
        o.status,
        o.source,
        new Date(o.created_at).toISOString().slice(0, 10),
        o.notes ?? '',
    ]);

    const header = ['رقم_الطلب', 'العميل', 'الهاتف', 'المنتج', 'الكمية', 'المبلغ', 'الحالة', 'المصدر', 'التاريخ', 'ملاحظات'];
    return [header, ...rows].map(r => r.join(',')).join('\n');
}
