'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import type { OrderStatus, OrderSource } from '@/lib/database.types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CustomerSegment = 'vip' | 'active' | 'inactive';

export interface CustomerAdmin {
    id:              string;
    name:            string;
    phone:           string | null;
    email:           string | null;
    city:            string | null;
    country:         string;
    total_orders:    number;
    total_spent:     number;
    avg_order_value: number;          // computed
    notes:           string | null;   // admin-only private notes
    segment:         CustomerSegment;
    last_order_at:   string | null;
    created_at:      string;
}

export interface CustomerOrderRow {
    id:           string;
    order_number: string;
    quantity:     number;
    total_amount: number;
    status:       OrderStatus;
    source:       OrderSource;
    product_name:    string | null;
    product_name_ar: string | null;
    notes:        string | null;
    created_at:   string;
}

export interface GetCustomersOptions {
    search?:  string;
    segment?: CustomerSegment | '';
    sortBy?:  'name' | 'total_spent' | 'total_orders' | 'last_order_at' | 'created_at';
    sortDir?: 'asc' | 'desc';
    page?:    number;
    limit?:   number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toCustomer(row: any): CustomerAdmin {
    const totalOrders = Number(row.total_orders ?? 0);
    const totalSpent  = Number(row.total_spent  ?? 0);
    return {
        id:              row.id,
        name:            row.name,
        phone:           row.phone       ?? null,
        email:           row.email       ?? null,
        city:            row.city        ?? null,
        country:         row.country     ?? 'SA',
        total_orders:    totalOrders,
        total_spent:     totalSpent,
        avg_order_value: totalOrders > 0 ? totalSpent / totalOrders : 0,
        notes:           row.notes       ?? null,
        segment:         (row.segment    ?? 'inactive') as CustomerSegment,
        last_order_at:   row.last_order_at ?? null,
        created_at:      row.created_at,
    };
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Fetch all customers with optional filters and sorting. */
export async function getCustomers(
    opts?: GetCustomersOptions
): Promise<{ customers: CustomerAdmin[]; total: number }> {
    const {
        search,
        segment,
        sortBy  = 'total_spent',
        sortDir = 'desc',
        page    = 1,
        limit   = 50,
    } = opts ?? {};

    const from = (page - 1) * limit;

    let q = supabaseAdmin
        .from('customers')
        .select('*', { count: 'exact' })
        .order(sortBy, { ascending: sortDir === 'asc' })
        .range(from, from + limit - 1);

    if (segment)           q = q.eq('segment', segment);
    if (search?.trim()) {
        const s = search.trim();
        q = q.or(`name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%,city.ilike.%${s}%`);
    }

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    return {
        customers: (data ?? []).map(toCustomer),
        total:     count ?? 0,
    };
}

/** Fetch a single customer by ID. */
export async function getCustomerById(id: string): Promise<CustomerAdmin | null> {
    const { data, error } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return null;
    return toCustomer(data);
}

/** Fetch full order history for a customer (latest first). */
export async function getCustomerOrders(customerId: string): Promise<CustomerOrderRow[]> {
    const { data, error } = await supabaseAdmin
        .from('orders')
        .select(`
            id, order_number, quantity, total_amount, status, source, notes, created_at,
            products ( name, name_ar )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((o: any) => ({
        id:              o.id,
        order_number:    o.order_number,
        quantity:        o.quantity,
        total_amount:    Number(o.total_amount),
        status:          o.status,
        source:          o.source,
        product_name:    o.products?.name    ?? null,
        product_name_ar: o.products?.name_ar ?? null,
        notes:           o.notes             ?? null,
        created_at:      o.created_at,
    }));
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Persist admin-only private notes for a customer. */
export async function updateCustomerNotes(
    customerId: string,
    notes: string,
): Promise<void> {
    const { error } = await supabaseAdmin
        .from('customers')
        .update({ notes: notes || null } as any)
        .eq('id', customerId);

    if (error) throw new Error(error.message);
}

/** Manually override a customer's segment (useful before the trigger fires). */
export async function updateCustomerSegment(
    customerId: string,
    segment: CustomerSegment,
): Promise<void> {
    const { error } = await supabaseAdmin
        .from('customers')
        .update({ segment } as any)
        .eq('id', customerId);

    if (error) throw new Error(error.message);
}

/** Create a new customer manually. */
export async function createCustomer(input: {
    name:    string;
    phone?:  string | null;
    email?:  string | null;
    city?:   string | null;
    notes?:  string | null;
}): Promise<CustomerAdmin> {
    const { data, error } = await supabaseAdmin
        .from('customers')
        .insert({
            name:    input.name.trim(),
            phone:   input.phone  ?? null,
            email:   input.email  ?? null,
            city:    input.city   ?? null,
            notes:   input.notes  ?? null,
            segment: 'inactive',
        } as any)
        .select('*')
        .single();

    if (error) throw new Error(error.message);
    return toCustomer(data);
}

/** Compute segment summary counts. */
export async function getCustomerSegmentCounts(): Promise<{
    total:    number;
    vip:      number;
    active:   number;
    inactive: number;
}> {
    const { data, error } = await supabaseAdmin
        .from('customers')
        .select('segment');

    if (error) throw new Error(error.message);

    const rows = data ?? [];
    return {
        total:    rows.length,
        vip:      rows.filter(r => r.segment === 'vip').length,
        active:   rows.filter(r => r.segment === 'active').length,
        inactive: rows.filter(r => (r.segment ?? 'inactive') === 'inactive').length,
    };
}
