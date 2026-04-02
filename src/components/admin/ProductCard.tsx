'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { updateProduct, deleteProduct } from '@/lib/actions/products';
import type { ProductAdmin } from '@/lib/actions/products';
import { useCurrency } from '@/context/CurrencyContext';

interface Props {
    product: ProductAdmin;
    onEdit: (product: ProductAdmin) => void;
    onChanged: () => void;   // refresh parent list
}

export default function ProductCard({ product, onEdit, onChanged }: Props) {
    const { formatPrice } = useCurrency();
    // ── Inline price edit ───────────────────────────────────────────────────
    const [editingPrice, setEditingPrice] = useState(false);
    const [priceInput, setPriceInput] = useState(String(product.price_sar));

    // ── Active toggle / archive ─────────────────────────────────────────────
    const [confirmArchive, setConfirmArchive] = useState(false);
    const [pending, startTransition] = useTransition();

    // ── Stock color ─────────────────────────────────────────────────────────
    const qty = product.stock_quantity;
    const thr = product.low_stock_threshold;
    const stockColor =
        qty === 0 ? '#ff6b6b' :
            qty < thr ? '#f97316' :
                qty < thr * 2 ? '#fbbf24' : '#4ade80';

    // ── Handlers ────────────────────────────────────────────────────────────

    function commitPrice() {
        const parsed = parseFloat(priceInput);
        if (isNaN(parsed) || parsed <= 0) { setPriceInput(String(product.price_sar)); setEditingPrice(false); return; }
        if (parsed === product.price_sar) { setEditingPrice(false); return; }
        startTransition(async () => {
            await updateProduct(product.id, { price_sar: parsed });
            onChanged();
            setEditingPrice(false);
        });
    }

    function toggleActive() {
        startTransition(async () => {
            await updateProduct(product.id, { is_active: !product.is_active });
            onChanged();
        });
    }

    function handleArchive() {
        startTransition(async () => {
            await deleteProduct(product.id);
            setConfirmArchive(false);
            onChanged();
        });
    }

    return (
        <div
            className="rounded-2xl overflow-hidden flex flex-col transition-all duration-150"
            style={{
                background: '#120e08',
                border: `1px solid ${product.is_active ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.05)'}`,
                opacity: product.is_active ? 1 : 0.6,
            }}
        >
            {/* ── Image ──────────────────────────────────────────────────── */}
            <div
                className="relative flex items-center justify-center overflow-hidden"
                style={{ height: 180, background: '#1a1208' }}
            >
                {product.image_url ? (
                    <div className="relative w-full h-full">
                        <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                ) : (
                    <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                )}

                {/* Inactive badge */}
                {!product.is_active && (
                    <div
                        className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(255,107,107,0.2)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)' }}
                    >
                        مؤرشف
                    </div>
                )}

                {/* Active toggle pill */}
                <button
                    onClick={toggleActive}
                    disabled={pending}
                    title={product.is_active ? 'إخفاء المنتج' : 'إظهار المنتج'}
                    className="absolute top-2 left-2 transition-opacity disabled:opacity-40"
                    style={{
                        width: 32, height: 18, borderRadius: 9,
                        background: product.is_active ? '#4ade80' : 'rgba(255,255,255,0.15)',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'absolute',
                    }}
                >
                    <span
                        style={{
                            display: 'block',
                            width: 12, height: 12,
                            borderRadius: '50%',
                            background: '#fff',
                            margin: '3px',
                            marginLeft: product.is_active ? 17 : 3,
                            transition: 'margin 0.15s',
                        }}
                    />
                </button>
            </div>

            {/* ── Body ──────────────────────────────────────────────────── */}
            <div className="flex-1 p-4 space-y-3">
                {/* Names */}
                <div>
                    <p className="font-medium text-base leading-snug" style={{ color: '#EBE5D9' }}>
                        {product.name_ar}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(235,229,217,0.4)' }}>
                        {product.name}
                    </p>
                </div>

                {/* Price — inline editable */}
                <div className="flex items-center gap-1">
                    {editingPrice ? (
                        <>
                            <input
                                autoFocus
                                type="number"
                                step="0.01"
                                min="0"
                                value={priceInput}
                                onChange={e => setPriceInput(e.target.value)}
                                onBlur={commitPrice}
                                onKeyDown={e => { if (e.key === 'Enter') commitPrice(); if (e.key === 'Escape') { setPriceInput(String(product.price_sar)); setEditingPrice(false); } }}
                                className="rounded-lg px-2 py-1 text-sm tabular-nums w-24 outline-none"
                                style={{
                                    background: '#0d0905',
                                    border: '1px solid rgba(212,175,55,0.4)',
                                    color: '#D4AF37',
                                    direction: 'ltr',
                                    textAlign: 'right',
                                }}
                            />
                        </>
                    ) : (
                        <button
                            onClick={() => setEditingPrice(true)}
                            title="انقر لتعديل السعر"
                            className="flex items-center gap-1 group"
                        >
                            <span className="tabular-nums font-semibold" style={{ color: '#D4AF37' }}>
                                {formatPrice(product.price_sar)}
                            </span>
                            <svg
                                width={11} height={11} viewBox="0 0 24 24" fill="none"
                                stroke="rgba(212,175,55,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Mini stats row */}
                <div className="grid grid-cols-2 gap-2">
                    <div
                        className="rounded-lg px-2.5 py-1.5 text-center"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <p className="text-[10px] mb-0.5" style={{ color: 'rgba(212,175,55,0.45)' }}>المخزون</p>
                        <p className="tabular-nums text-sm font-semibold" style={{ color: stockColor }}>
                            {qty.toLocaleString('ar-SA')}
                        </p>
                    </div>
                    <div
                        className="rounded-lg px-2.5 py-1.5 text-center"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <p className="text-[10px] mb-0.5" style={{ color: 'rgba(212,175,55,0.45)' }}>تم بيعه</p>
                        <p className="tabular-nums text-sm font-semibold" style={{ color: 'rgba(235,229,217,0.7)' }}>
                            {product.total_sold.toLocaleString('ar-SA')}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Footer actions ─────────────────────────────────────────── */}
            <div
                className="px-4 pb-4 flex gap-2"
            >
                {!confirmArchive ? (
                    <>
                        <button
                            onClick={() => onEdit(product)}
                            className="flex-1 py-2 rounded-lg text-xs transition-colors"
                            style={{
                                background: 'linear-gradient(135deg,#D4AF37,#B8960C)',
                                color: '#0d0905',
                                fontWeight: 500,
                            }}
                        >
                            تعديل
                        </button>
                        <button
                            onClick={() => setConfirmArchive(true)}
                            disabled={pending}
                            title="أرشفة المنتج"
                            className="px-3 py-2 rounded-lg text-xs transition-colors disabled:opacity-40"
                            style={{
                                background: 'rgba(255,107,107,0.08)',
                                border: '1px solid rgba(255,107,107,0.15)',
                                color: '#ff6b6b',
                            }}
                        >
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={handleArchive}
                            disabled={pending}
                            className="flex-1 py-2 rounded-lg text-xs font-medium disabled:opacity-40"
                            style={{ background: '#ff6b6b', color: '#0d0905' }}
                        >
                            {pending ? '...' : 'تأكيد الأرشفة'}
                        </button>
                        <button
                            onClick={() => setConfirmArchive(false)}
                            className="flex-1 py-2 rounded-lg text-xs"
                            style={{
                                background: 'rgba(235,229,217,0.05)',
                                border: '1px solid rgba(235,229,217,0.1)',
                                color: 'rgba(235,229,217,0.6)',
                            }}
                        >
                            إلغاء
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
