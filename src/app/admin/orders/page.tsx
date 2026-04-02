'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import OrderDetailPanel from '@/components/admin/OrderDetailPanel';
import AddOrderModal from '@/components/admin/AddOrderModal';
import { exportOrdersCSV } from '@/lib/actions/orders';
import type { Database } from '@/lib/database.types';
import type { OrderWithDetails } from '@/lib/database.types';
import { useCurrency } from '@/context/CurrencyContext';

const STATUS_OPTIONS = [
    { value: '', label: 'كل الحالات' },
    { value: 'pending', label: 'معلق' },
    { value: 'processing', label: 'قيد التنفيذ' },
    { value: 'shipped', label: 'تم الشحن' },
    { value: 'delivered', label: 'تم التسليم' },
    { value: 'cancelled', label: 'ملغي' },
];

const SOURCE_OPTIONS = [
    { value: '', label: 'كل المصادر' },
    { value: 'website', label: 'الموقع' },
    { value: 'whatsapp', label: 'واتساب' },
    { value: 'instagram', label: 'انستغرام' },
];

const STATUS_COLOR: Record<string, string> = {
    pending: '#fbbf24',
    processing: '#60a5fa',
    shipped: '#34d399',
    delivered: '#4ade80',
    cancelled: '#ff6b6b',
};

const STATUS_LABEL: Record<string, string> = {
    pending: 'معلق',
    processing: 'قيد التنفيذ',
    shipped: 'تم الشحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
};

const SOURCE_COLOR: Record<string, string> = {
    website: '#D4AF37',
    whatsapp: '#25D366',
    instagram: '#E1306C',
};

const SOURCE_LABEL: Record<string, string> = {
    website: 'الموقع',
    whatsapp: 'واتساب',
    instagram: 'انستغرام',
};

const PAGE_SIZE = 20;

export default function OrdersPage() {
    const { formatPrice } = useCurrency();
    const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [selected, setSelected] = useState<OrderWithDetails | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [exporting, startExport] = useTransition();

    const load = useCallback(async () => {
        setLoading(true);
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let q = supabase
            .from('orders')
            .select(`
                id, order_number, quantity, total_amount, status, source,
                created_at, notes, updated_at, customer_id, product_id,
                payment_method, payment_status,
                customers ( name, phone ),
                products  ( name, name_ar )
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (statusFilter) q = q.eq('status', statusFilter as any);
        if (sourceFilter) q = q.eq('source', sourceFilter as any);
        if (search) q = q.ilike('order_number', `%${search}%`);

        const { data: rawData, error, count } = await q;
        if (error) { setLoading(false); return; }
        const data = rawData as any[] | null;

        setOrders((data ?? []).map((o: any) => ({
            id: o.id,
            order_number: o.order_number,
            customer_id: o.customer_id,
            product_id: o.product_id,
            quantity: o.quantity,
            total_amount: Number(o.total_amount),
            status: o.status,
            source: o.source,
            notes: o.notes,
            payment_method: o.payment_method,
            payment_status: o.payment_status,
            created_at: o.created_at,
            updated_at: o.updated_at,
            customer_name: (o.customers as any)?.name ?? null,
            customer_phone: (o.customers as any)?.phone ?? null,
            product_name: (o.products as any)?.name ?? null,
            product_name_ar: (o.products as any)?.name_ar ?? null,
        })));
        setTotal(count ?? 0);
        setLoading(false);
    }, [supabase, page, search, statusFilter, sourceFilter]);

    useEffect(() => { load(); }, [load]);

    // Reset page on filter change
    useEffect(() => { setPage(1); }, [search, statusFilter, sourceFilter]);

    function handleExport() {
        startExport(async () => {
            const csv = await exportOrdersCSV({ status: statusFilter || undefined, source: sourceFilter || undefined });
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'orders.csv'; a.click();
            URL.revokeObjectURL(url);
        });
    }

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="p-6 space-y-5 max-w-[1400px]" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-light" style={{ color: '#EBE5D9' }}>الطلبات</h1>
                    <p className="text-xs mt-1" style={{ color: 'rgba(212,175,55,0.45)' }}>
                        {total.toLocaleString('ar-SA')} طلب
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        style={{
                            background: 'rgba(212,175,55,0.07)',
                            border: '1px solid rgba(212,175,55,0.15)',
                            color: 'rgba(212,175,55,0.7)',
                        }}
                    >
                        {exporting ? '...' : 'تصدير CSV'}
                    </button>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="text-xs px-4 py-2 rounded-lg transition-colors"
                        style={{
                            background: 'linear-gradient(135deg,#D4AF37,#B8960C)',
                            color: '#0d0905',
                            fontWeight: 500,
                        }}
                    >
                        + طلب جديد
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                {/* Search */}
                <input
                    type="search"
                    placeholder="بحث برقم الطلب..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="rounded-lg px-4 py-2 text-sm outline-none"
                    style={{
                        background: '#120e08',
                        border: '1px solid rgba(212,175,55,0.12)',
                        color: '#EBE5D9',
                        minWidth: 200,
                        direction: 'rtl',
                    }}
                />
                {/* Status filter */}
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                        background: '#120e08',
                        border: '1px solid rgba(212,175,55,0.12)',
                        color: '#EBE5D9',
                    }}
                >
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {/* Source filter */}
                <select
                    value={sourceFilter}
                    onChange={e => setSourceFilter(e.target.value)}
                    className="rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                        background: '#120e08',
                        border: '1px solid rgba(212,175,55,0.12)',
                        color: '#EBE5D9',
                    }}
                >
                    {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>

            {/* Table */}
            <div
                className="rounded-xl overflow-hidden"
                style={{ background: '#120e08', border: '1px solid rgba(212,175,55,0.1)' }}
            >
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <svg width={24} height={24} viewBox="0 0 24 24" className="animate-spin" style={{ animationDuration: '0.8s' }}>
                            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="2.5" />
                            <path d="M12 2 a10 10 0 0 1 10 10" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-16 text-sm" style={{ color: 'rgba(235,229,217,0.3)' }}>
                        لا توجد طلبات مطابقة
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
                                    {['رقم الطلب', 'العميل', 'المبلغ', 'الدفع', 'المصدر', 'الحالة', 'التاريخ'].map(h => (
                                        <th
                                            key={h}
                                            className="px-4 pb-3 pt-4 text-right font-normal text-xs tracking-wider"
                                            style={{ color: 'rgba(212,175,55,0.5)' }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(o => (
                                    <tr
                                        key={o.id}
                                        onClick={() => setSelected(o)}
                                        className="cursor-pointer transition-colors duration-100"
                                        style={{ borderBottom: '1px solid rgba(212,175,55,0.05)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.03)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <td className="px-4 py-3 tabular-nums" style={{ color: 'rgba(212,175,55,0.8)' }}>
                                            #{o.order_number}
                                        </td>
                                        <td className="px-4 py-3" style={{ color: '#EBE5D9' }}>
                                            {o.customer_name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums" style={{ color: '#EBE5D9' }}>
                                            {formatPrice(Number(o.total_amount))}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-mono" style={{ color: o.payment_method === 'cash_on_delivery' ? '#60a5fa' : '#D4AF37' }}>
                                                    {o.payment_method === 'cash_on_delivery' ? 'COD' : o.payment_method === 'bank_transfer' ? 'Bank' : o.payment_method === 'apple_pay' ? 'Apple Pay' : 'Card'}
                                                </span>
                                                <span
                                                    className="inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-medium tracking-widest uppercase"
                                                    style={{
                                                        background: o.payment_status === 'paid' ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)',
                                                        color: o.payment_status === 'paid' ? '#4ade80' : '#fbbf24',
                                                    }}
                                                >
                                                    {o.payment_status === 'paid' ? 'Paid' : 'Pending'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs" style={{ color: SOURCE_COLOR[o.source] ?? '#888' }}>
                                                {SOURCE_LABEL[o.source] ?? o.source}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                                                style={{
                                                    background: `${STATUS_COLOR[o.status] ?? '#888'}22`,
                                                    color: STATUS_COLOR[o.status] ?? '#888',
                                                }}
                                            >
                                                {STATUS_LABEL[o.status] ?? o.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 tabular-nums text-xs" style={{ color: 'rgba(235,229,217,0.4)' }}>
                                            {new Date(o.created_at).toLocaleDateString('ar-SA', {
                                                year: 'numeric', month: 'short', day: 'numeric',
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-30"
                        style={{
                            background: 'rgba(212,175,55,0.08)',
                            border: '1px solid rgba(212,175,55,0.15)',
                            color: '#D4AF37',
                        }}
                    >
                        ◀ السابق
                    </button>
                    <span className="text-xs tabular-nums" style={{ color: 'rgba(235,229,217,0.4)' }}>
                        {page} / {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-30"
                        style={{
                            background: 'rgba(212,175,55,0.08)',
                            border: '1px solid rgba(212,175,55,0.15)',
                            color: '#D4AF37',
                        }}
                    >
                        التالي ▶
                    </button>
                </div>
            )}

            {/* Detail panel */}
            <OrderDetailPanel
                order={selected}
                onClose={() => setSelected(null)}
                onUpdate={load}
            />

            {/* Add modal */}
            {showAdd && (
                <AddOrderModal
                    onClose={() => setShowAdd(false)}
                    onCreated={load}
                />
            )}
        </div>
    );
}
