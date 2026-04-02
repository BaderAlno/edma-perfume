'use client';

import { useEffect, useState } from 'react';
import type { OrderWithDetails, ProductWithStockStatus } from '@/lib/database.types';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

export interface DashboardData {
    // Metrics
    revenueThisMonth: number;
    revenueLastMonth: number;
    ordersThisMonth: number;
    ordersLastMonth: number;
    avgOrderValue: number;
    lowStockCount: number;
    pendingCount: number;
    totalCustomers: number;
    // Charts
    revenueByProduct: { name: string; revenue: number }[];
    ordersBySource: { name: string; value: number; color: string }[];
    // Lists
    recentOrders: OrderWithDetails[];
    lowStockProducts: ProductWithStockStatus[];
}

const SOURCE_COLORS: Record<string, string> = {
    website: '#D4AF37',
    whatsapp: '#25D366',
    instagram: '#E1306C',
};

function startOf(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}
function startOfPrev(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() - 1, 1).toISOString();
}

export function useDashboardData() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const supabase = getSupabaseBrowserClient();

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const now = new Date();
                const thisStart = startOf(now);
                const prevStart = startOfPrev(now);

                const [ordersRes, productsRes, customersRes] = await Promise.all([
                    supabase
                        .from('orders')
                        .select(`
                            id, order_number, quantity, total_amount, status, source, created_at, notes, updated_at,
                            customer_id, product_id,
                            customers ( name, phone ),
                            products  ( name, name_ar )
                        `)
                        .order('created_at', { ascending: false }),

                    supabase
                        .from('products')
                        .select('*')
                        .eq('is_active', true),

                    supabase
                        .from('customers')
                        .select('id', { count: 'exact', head: true }),
                ]);

                if (ordersRes.error) {
                    console.error("Supabase Error (orders):", ordersRes.error);
                    throw ordersRes.error;
                }
                if (productsRes.error) {
                    console.error("Supabase Error (products):", productsRes.error);
                    throw productsRes.error;
                }
                if (customersRes.error) {
                    console.error("Supabase Error (customers):", customersRes.error);
                    throw customersRes.error;
                }

                const allOrders = (ordersRes.data ?? []) as any[];
                const products = (productsRes.data ?? []) as any[];

                // ── Metrics ────────────────────────────────────────────────
                // Relaxing string comparison by coercing to exact MS timestamp explicitly
                const thisStartMs = new Date(thisStart).getTime();
                const prevStartMs = new Date(prevStart).getTime();

                const thisOrders = allOrders.filter(o => new Date(o.created_at).getTime() >= thisStartMs);
                const prevOrders = allOrders.filter(o => {
                    const t = new Date(o.created_at).getTime();
                    return t >= prevStartMs && t < thisStartMs;
                });
                const active = (o: typeof allOrders[0]) => o.status !== 'cancelled';
                const allActive = allOrders.filter(active);

                const revenueThisMonth = thisOrders.filter(active).reduce((s, o) => s + Number(o.total_amount), 0);
                const revenueLastMonth = prevOrders.filter(active).reduce((s, o) => s + Number(o.total_amount), 0);
                const ordersThisMonth = thisOrders.length;
                const ordersLastMonth = prevOrders.length;
                const avgOrderValue = allActive.length > 0 ? (allActive.reduce((s, o) => s + Number(o.total_amount), 0) / allActive.length) : 0;
                const pendingCount = allOrders.filter(o => o.status === 'pending' || o.status === 'processing').length;

                // ── Low stock ──────────────────────────────────────────────
                const lowStockProducts: ProductWithStockStatus[] = products
                    .filter(p => p.stock_quantity <= p.low_stock_threshold)
                    .map(p => ({
                        ...p,
                        stock_status: p.stock_quantity === 0 ? 'critical' : 'low',
                    } as ProductWithStockStatus));

                // ── Revenue by product (this month) ────────────────────────
                const revenueByProduct = products.map(p => {
                    const matched = thisOrders.filter(active).filter(o => o.product_id === p.id);
                    const revenue = matched.reduce((s, o) => s + Number(o.total_amount), 0);
                    return { name: p.name_ar || p.name, revenue };
                }).sort((a, b) => b.revenue - a.revenue);

                // ── Orders by source (this month) ──────────────────────────
                const srcMap = new Map<string, number>();
                for (const o of thisOrders) {
                    srcMap.set(o.source, (srcMap.get(o.source) ?? 0) + 1);
                }
                const ordersBySource = [...srcMap.entries()].map(([name, value]) => ({
                    name,
                    value,
                    color: SOURCE_COLORS[name] ?? '#888',
                }));

                // ── Recent orders (enriched) ───────────────────────────────
                const recentOrders: OrderWithDetails[] = allOrders.slice(0, 8).map(o => ({
                    id: o.id,
                    order_number: o.order_number,
                    customer_id: o.customer_id,
                    product_id: o.product_id,
                    quantity: o.quantity,
                    total_amount: Number(o.total_amount),
                    status: o.status,
                    source: o.source,
                    notes: o.notes,
                    created_at: o.created_at,
                    updated_at: o.updated_at,
                    customer_name: (o.customers as { name: string; phone: string } | null)?.name ?? null,
                    customer_phone: (o.customers as { name: string; phone: string } | null)?.phone ?? null,
                    product_name: (o.products as { name: string; name_ar: string } | null)?.name ?? null,
                    product_name_ar: (o.products as { name: string; name_ar: string } | null)?.name_ar ?? null,
                }));

                if (!cancelled) {
                    setData({
                        revenueThisMonth, revenueLastMonth,
                        ordersThisMonth, ordersLastMonth,
                        avgOrderValue, lowStockCount: lowStockProducts.length,
                        pendingCount, totalCustomers: customersRes.count ?? 0,
                        revenueByProduct, ordersBySource,
                        recentOrders, lowStockProducts,
                    });
                }
            } catch (err) {
                if (!cancelled) setError((err as Error).message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    return { data, loading, error };
}
