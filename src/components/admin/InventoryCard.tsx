'use client';

import Image from 'next/image';
import type { InventoryProduct } from '@/lib/actions/inventory';

interface Props {
    product: InventoryProduct;
    onAdjust: (product: InventoryProduct) => void;
}

const STATUS_LABEL: Record<string, string> = {
    ok: 'متوفر',
    low: 'منخفض',
    critical: 'حرج',
    out: 'نفد',
};

const STATUS_COLOR: Record<string, string> = {
    ok: '#4ade80',
    low: '#fbbf24',
    critical: '#f97316',
    out: '#ff6b6b',
};

const BAR_COLOR: Record<string, string> = {
    ok: '#4ade80',
    low: '#fbbf24',
    critical: '#f97316',
    out: '#ff6b6b',
};

export default function InventoryCard({ product, onAdjust }: Props) {
    const { stock_quantity: qty, low_stock_threshold: thr, stock_status } = product;

    // Bar width: 100% at thr×3, capped at 100%
    const maxRef = thr * 3 || 30;
    const barPct = Math.min(100, Math.round((qty / maxRef) * 100));
    const color = BAR_COLOR[stock_status] ?? '#888';
    const statusC = STATUS_COLOR[stock_status] ?? '#888';

    return (
        <div
            className="rounded-xl p-4 flex flex-col gap-3 transition-all duration-150"
            style={{
                background: '#120e08',
                border: `1px solid ${stock_status === 'ok' ? 'rgba(212,175,55,0.1)' : `${statusC}33`}`,
            }}
        >
            {/* Top row: image + names */}
            <div className="flex items-center gap-3">
                {/* Product image */}
                <div
                    className="rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ width: 52, height: 52, background: '#1a1208' }}
                >
                    {product.image_url ? (
                        <div className="relative w-full h-full">
                            <Image
                                src={product.image_url}
                                alt={product.name_ar || ""}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    )}
                </div>

                {/* Names + status badge */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#EBE5D9' }}>
                        {product.name_ar}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'rgba(235,229,217,0.45)' }}>
                        {product.name}
                    </p>
                </div>

                {/* Status badge */}
                <span
                    className="flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                        background: `${statusC}22`,
                        color: statusC,
                    }}
                >
                    {STATUS_LABEL[stock_status]}
                </span>
            </div>

            {/* Stock quantity */}
            <div className="flex items-end justify-between">
                <span className="tabular-nums font-semibold text-lg" style={{ color }}>
                    {qty.toLocaleString('ar-SA')}
                </span>
                <span className="text-xs" style={{ color: 'rgba(235,229,217,0.35)' }}>
                    الحد: {thr}
                </span>
            </div>

            {/* Progress bar */}
            <div
                className="rounded-full overflow-hidden"
                style={{ height: 5, background: 'rgba(255,255,255,0.06)' }}
            >
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barPct}%`, background: color }}
                />
            </div>

            {/* Adjust button */}
            <button
                onClick={() => onAdjust(product)}
                className="w-full text-xs py-2 rounded-lg transition-colors duration-150 mt-1"
                style={{
                    background: 'rgba(212,175,55,0.07)',
                    border: '1px solid rgba(212,175,55,0.15)',
                    color: 'rgba(212,175,55,0.8)',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(212,175,55,0.14)';
                    e.currentTarget.style.color = '#D4AF37';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(212,175,55,0.07)';
                    e.currentTarget.style.color = 'rgba(212,175,55,0.8)';
                }}
            >
                تعديل الكمية
            </button>
        </div>
    );
}
