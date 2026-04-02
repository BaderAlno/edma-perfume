'use client';

import { useCallback, useEffect, useState } from 'react';
import ProductCard from '@/components/admin/ProductCard';
import ProductModal from '@/components/admin/ProductModal';
import ExcelUploadButton from '@/components/admin/ExcelUploadButton';
import { getAllProductsAdmin } from '@/lib/actions/products';
import type { ProductAdmin } from '@/lib/actions/products';
import { useCurrency } from '@/context/CurrencyContext';

type Filter = 'all' | 'active' | 'inactive';

function Spinner() {
    return (
        <svg width={24} height={24} viewBox="0 0 24 24" className="animate-spin" style={{ animationDuration: '0.8s' }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="2.5" />
            <path d="M12 2 a10 10 0 0 1 10 10" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

export default function ProductsPage() {
    const { formatPrice } = useCurrency();
    const [products, setProducts] = useState<ProductAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('all');
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<'add' | ProductAdmin | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllProductsAdmin();
            setProducts(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // ── Derived list ─────────────────────────────────────────────────────────
    const filtered = products.filter(p => {
        if (filter === 'active' && !p.is_active) return false;
        if (filter === 'inactive' && p.is_active) return false;
        if (search) {
            const q = search.toLowerCase();
            return p.name.toLowerCase().includes(q) || p.name_ar.includes(q);
        }
        return true;
    });

    const activeCount = products.filter(p => p.is_active).length;
    const inactiveCount = products.filter(p => !p.is_active).length;
    const totalRevenue = products.reduce((s, p) => s + p.price_sar * p.total_sold, 0);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="p-6 space-y-6 max-w-[1400px]" dir="rtl">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-light" style={{ color: '#EBE5D9' }}>المنتجات</h1>
                    <p className="text-xs mt-1" style={{ color: 'rgba(212,175,55,0.45)' }}>
                        {products.length} منتج · {activeCount} نشط · إجمالي المبيعات{' '}
                        <span style={{ color: '#D4AF37' }}>{formatPrice(totalRevenue)}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <ExcelUploadButton onSuccess={load} />
                    <button
                        onClick={() => setModal('add')}
                        className="text-xs px-4 py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                        style={{
                            background: 'linear-gradient(135deg,#D4AF37,#B8960C)',
                            color: '#0d0905',
                            fontWeight: 500,
                        }}
                    >
                        + منتج جديد
                    </button>
                </div>
            </div>

            {/* ── Summary tiles ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'إجمالي المنتجات', value: products.length, color: '#D4AF37' },
                    { label: 'نشط', value: activeCount, color: '#4ade80' },
                    { label: 'مؤرشف', value: inactiveCount, color: '#ff6b6b' },
                    { label: 'وحدات مُباعة', value: products.reduce((s, p) => s + p.total_sold, 0), color: '#60a5fa' },
                ].map(tile => (
                    <div
                        key={tile.label}
                        className="rounded-xl px-4 py-3"
                        style={{ background: '#120e08', border: '1px solid rgba(212,175,55,0.08)' }}
                    >
                        <p className="text-[10px] tracking-wider uppercase mb-1" style={{ color: 'rgba(212,175,55,0.45)' }}>
                            {tile.label}
                        </p>
                        <p className="tabular-nums text-xl font-semibold" style={{ color: tile.color }}>
                            {tile.value.toLocaleString('ar-SA')}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Filters + search ───────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <input
                    type="search"
                    placeholder="بحث..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="rounded-lg px-4 py-2 text-sm outline-none"
                    style={{
                        background: '#120e08',
                        border: '1px solid rgba(212,175,55,0.12)',
                        color: '#EBE5D9',
                        minWidth: 200,
                    }}
                />

                {/* Filter tabs */}
                <div className="flex gap-1 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.12)' }}>
                    {([
                        { key: 'all', label: 'الكل' },
                        { key: 'active', label: 'نشط' },
                        { key: 'inactive', label: 'مؤرشف' },
                    ] as { key: Filter; label: string }[]).map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className="px-3 py-1.5 text-xs transition-colors"
                            style={{
                                background: filter === f.key ? 'rgba(212,175,55,0.14)' : 'transparent',
                                color: filter === f.key ? '#D4AF37' : 'rgba(235,229,217,0.5)',
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Products grid ──────────────────────────────────────────── */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Spinner />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-sm" style={{ color: 'rgba(235,229,217,0.3)' }}>
                        {search ? 'لا توجد نتائج مطابقة' : 'لا توجد منتجات'}
                    </p>
                    {!search && (
                        <button
                            onClick={() => setModal('add')}
                            className="mt-4 text-xs px-4 py-2 rounded-lg"
                            style={{
                                background: 'rgba(212,175,55,0.08)',
                                border: '1px solid rgba(212,175,55,0.15)',
                                color: '#D4AF37',
                            }}
                        >
                            + أضف أول منتج
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(p => (
                        <ProductCard
                            key={p.id}
                            product={p}
                            onEdit={prod => setModal(prod)}
                            onChanged={load}
                        />
                    ))}
                </div>
            )}

            {/* ── Modal ──────────────────────────────────────────────────── */}
            {modal !== null && (
                <ProductModal
                    product={modal === 'add' ? null : modal}
                    onClose={() => setModal(null)}
                    onSaved={() => { setModal(null); load(); }}
                />
            )}
        </div>
    );
}
