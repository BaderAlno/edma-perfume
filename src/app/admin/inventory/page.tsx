'use client';

import { useCallback, useEffect, useState } from 'react';
import InventoryCard    from '@/components/admin/InventoryCard';
import StockAdjustModal from '@/components/admin/StockAdjustModal';
import {
    getInventoryStatus,
    getInventoryLogs,
} from '@/lib/actions/inventory';
import type { InventoryProduct, InventoryLog } from '@/lib/actions/inventory';

const WHATSAPP_BASE = 'https://wa.me/';   // append phone without +

const REASONS_AR: Record<string, string> = {
    'إضافة مخزون': 'إضافة مخزون',
    'تلف':          'تلف',
    'إرجاع':        'إرجاع',
    'تعديل يدوي':  'تعديل يدوي',
    'طلب مُسلَّم': 'طلب مُسلَّم',
    'sale':         'طلب مُسلَّم',
    'Initial stock':'رصيد أولي',
};

function Spinner() {
    return (
        <svg width={24} height={24} viewBox="0 0 24 24" className="animate-spin" style={{ animationDuration: '0.8s' }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="2.5" />
            <path d="M12 2 a10 10 0 0 1 10 10" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

const LOG_PAGE_SIZE = 30;

export default function InventoryPage() {
    const [products,     setProducts]     = useState<InventoryProduct[]>([]);
    const [logs,         setLogs]         = useState<InventoryLog[]>([]);
    const [logsTotal,    setLogsTotal]    = useState(0);
    const [logsPage,     setLogsPage]     = useState(1);
    const [loadingProds, setLoadingProds] = useState(true);
    const [loadingLogs,  setLoadingLogs]  = useState(true);
    const [adjustTarget, setAdjustTarget] = useState<InventoryProduct | null>(null);

    // Log filters
    const [filterProduct, setFilterProduct] = useState('');
    const [filterFrom,    setFilterFrom]    = useState('');
    const [filterTo,      setFilterTo]      = useState('');

    // ── Data loaders ─────────────────────────────────────────────────────────

    const loadProducts = useCallback(async () => {
        setLoadingProds(true);
        try {
            const data = await getInventoryStatus();
            setProducts(data);
        } finally {
            setLoadingProds(false);
        }
    }, []);

    const loadLogs = useCallback(async (page = logsPage) => {
        setLoadingLogs(true);
        try {
            const { logs: data, total } = await getInventoryLogs({
                productId: filterProduct || undefined,
                dateFrom:  filterFrom    || undefined,
                dateTo:    filterTo      || undefined,
                page,
                limit: LOG_PAGE_SIZE,
            });
            setLogs(data);
            setLogsTotal(total);
        } finally {
            setLoadingLogs(false);
        }
    }, [filterProduct, filterFrom, filterTo, logsPage]);

    useEffect(() => { loadProducts(); }, [loadProducts]);
    useEffect(() => { loadLogs(logsPage); }, [loadLogs, logsPage]);

    // Reset page when filters change
    useEffect(() => { setLogsPage(1); }, [filterProduct, filterFrom, filterTo]);

    // ── Derived data ──────────────────────────────────────────────────────────

    const lowStockProducts = products.filter(p => p.stock_status !== 'ok');
    const totalLogPages    = Math.ceil(logsTotal / LOG_PAGE_SIZE);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="p-6 space-y-6 max-w-[1400px]" dir="rtl">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-light" style={{ color: '#EBE5D9' }}>المخزون</h1>
                    <p className="text-xs mt-1" style={{ color: 'rgba(212,175,55,0.45)' }}>
                        {products.length} منتج · {lowStockProducts.length} يحتاج مراجعة
                    </p>
                </div>
            </div>

            {/* ── Low-stock alerts ───────────────────────────────────────── */}
            {lowStockProducts.length > 0 && (
                <section className="space-y-2">
                    <p className="text-xs font-medium tracking-wider uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>
                        تنبيهات المخزون
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {lowStockProducts.map(p => {
                            const isOut   = p.stock_status === 'out';
                            const accentC = isOut ? '#ff6b6b' : p.stock_status === 'critical' ? '#f97316' : '#fbbf24';
                            const phone   = '966500000000'; // placeholder — real app would have supplier phone
                            const msg     = encodeURIComponent(
                                `مرحباً، نحتاج إلى تجديد مخزون ${p.name_ar} (${p.name}). الكمية المتبقية: ${p.stock_quantity}`
                            );
                            return (
                                <div
                                    key={p.id}
                                    className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                                    style={{
                                        background: `${accentC}0d`,
                                        border:     `1px solid ${accentC}33`,
                                    }}
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ color: '#EBE5D9' }}>
                                            {p.name_ar}
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: accentC }}>
                                            {isOut ? 'نفد المخزون' : `${p.stock_quantity} قطعة متبقية`}
                                        </p>
                                    </div>
                                    <a
                                        href={`${WHATSAPP_BASE}${phone}?text=${msg}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-opacity hover:opacity-80"
                                        style={{
                                            background: 'rgba(37,211,102,0.12)',
                                            border:     '1px solid rgba(37,211,102,0.25)',
                                            color:      '#25D366',
                                        }}
                                    >
                                        <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                                        </svg>
                                        طلب تجديد
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── Inventory cards grid ───────────────────────────────────── */}
            <section className="space-y-3">
                <p className="text-xs font-medium tracking-wider uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>
                    حالة المخزون
                </p>

                {loadingProds ? (
                    <div className="flex items-center justify-center py-12">
                        <Spinner />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12 text-sm" style={{ color: 'rgba(235,229,217,0.3)' }}>
                        لا توجد منتجات
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {products.map(p => (
                            <InventoryCard
                                key={p.id}
                                product={p}
                                onAdjust={setAdjustTarget}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ── Inventory log table ────────────────────────────────────── */}
            <section className="space-y-3">
                <p className="text-xs font-medium tracking-wider uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>
                    سجل حركات المخزون
                </p>

                {/* Log filters */}
                <div className="flex flex-wrap gap-3">
                    <select
                        value={filterProduct}
                        onChange={e => setFilterProduct(e.target.value)}
                        className="rounded-lg px-3 py-2 text-sm outline-none"
                        style={{
                            background: '#120e08',
                            border:     '1px solid rgba(212,175,55,0.12)',
                            color:      '#EBE5D9',
                            minWidth:   160,
                        }}
                    >
                        <option value="">كل المنتجات</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name_ar}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={filterFrom}
                        onChange={e => setFilterFrom(e.target.value)}
                        className="rounded-lg px-3 py-2 text-sm outline-none"
                        style={{
                            background: '#120e08',
                            border:     '1px solid rgba(212,175,55,0.12)',
                            color:      '#EBE5D9',
                        }}
                    />
                    <input
                        type="date"
                        value={filterTo}
                        onChange={e => setFilterTo(e.target.value)}
                        className="rounded-lg px-3 py-2 text-sm outline-none"
                        style={{
                            background: '#120e08',
                            border:     '1px solid rgba(212,175,55,0.12)',
                            color:      '#EBE5D9',
                        }}
                    />

                    {(filterProduct || filterFrom || filterTo) && (
                        <button
                            onClick={() => { setFilterProduct(''); setFilterFrom(''); setFilterTo(''); }}
                            className="text-xs px-3 py-2 rounded-lg"
                            style={{
                                background: 'rgba(255,107,107,0.08)',
                                border:     '1px solid rgba(255,107,107,0.15)',
                                color:      '#ff6b6b',
                            }}
                        >
                            مسح الفلاتر
                        </button>
                    )}
                </div>

                {/* Table */}
                <div
                    className="rounded-xl overflow-hidden"
                    style={{ background: '#120e08', border: '1px solid rgba(212,175,55,0.1)' }}
                >
                    {loadingLogs ? (
                        <div className="flex items-center justify-center py-12">
                            <Spinner />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-sm" style={{ color: 'rgba(235,229,217,0.3)' }}>
                            لا توجد سجلات مطابقة
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
                                        {['التاريخ', 'المنتج', 'التغيير', 'السبب', 'الرصيد بعد التعديل'].map(h => (
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
                                    {logs.map(log => {
                                        const isAdd = log.change_amount > 0;
                                        const rowBg = isAdd
                                            ? 'rgba(74,222,128,0.025)'
                                            : 'rgba(255,107,107,0.025)';
                                        return (
                                            <tr
                                                key={log.id}
                                                style={{
                                                    borderBottom: '1px solid rgba(212,175,55,0.05)',
                                                    background:   rowBg,
                                                }}
                                            >
                                                <td className="px-4 py-3 tabular-nums text-xs" style={{ color: 'rgba(235,229,217,0.4)' }}>
                                                    {new Date(log.created_at).toLocaleDateString('ar-SA', {
                                                        year: 'numeric', month: 'short', day: 'numeric',
                                                    })}
                                                    <br />
                                                    <span style={{ color: 'rgba(235,229,217,0.25)' }}>
                                                        {new Date(log.created_at).toLocaleTimeString('ar-SA', {
                                                            hour: '2-digit', minute: '2-digit',
                                                        })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3" style={{ color: '#EBE5D9' }}>
                                                    <span className="block">{log.product_name_ar}</span>
                                                    <span className="text-xs" style={{ color: 'rgba(235,229,217,0.4)' }}>
                                                        {log.product_name}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 tabular-nums font-semibold" style={{ color: isAdd ? '#4ade80' : '#ff6b6b' }}>
                                                    {isAdd ? '+' : ''}{log.change_amount.toLocaleString('ar-SA')}
                                                </td>
                                                <td className="px-4 py-3 text-xs" style={{ color: 'rgba(235,229,217,0.6)' }}>
                                                    {REASONS_AR[log.reason ?? ''] ?? log.reason ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 tabular-nums text-sm" style={{ color: 'rgba(235,229,217,0.7)' }}>
                                                    {log.balance_after != null
                                                        ? log.balance_after.toLocaleString('ar-SA')
                                                        : <span style={{ color: 'rgba(235,229,217,0.25)' }}>—</span>
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Log pagination */}
                {totalLogPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            disabled={logsPage === 1}
                            onClick={() => setLogsPage(p => p - 1)}
                            className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-30"
                            style={{
                                background: 'rgba(212,175,55,0.08)',
                                border:     '1px solid rgba(212,175,55,0.15)',
                                color:      '#D4AF37',
                            }}
                        >
                            ◀ السابق
                        </button>
                        <span className="text-xs tabular-nums" style={{ color: 'rgba(235,229,217,0.4)' }}>
                            {logsPage} / {totalLogPages}
                        </span>
                        <button
                            disabled={logsPage === totalLogPages}
                            onClick={() => setLogsPage(p => p + 1)}
                            className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-30"
                            style={{
                                background: 'rgba(212,175,55,0.08)',
                                border:     '1px solid rgba(212,175,55,0.15)',
                                color:      '#D4AF37',
                            }}
                        >
                            التالي ▶
                        </button>
                    </div>
                )}
            </section>

            {/* ── Stock adjust modal ─────────────────────────────────────── */}
            {adjustTarget && (
                <StockAdjustModal
                    product={adjustTarget}
                    onClose={() => setAdjustTarget(null)}
                    onSaved={() => {
                        setAdjustTarget(null);
                        loadProducts();
                        loadLogs(1);
                        setLogsPage(1);
                    }}
                />
            )}
        </div>
    );
}
