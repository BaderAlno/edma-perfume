'use client';

import { useState, useTransition } from 'react';
import { adjustStock }             from '@/lib/actions/inventory';
import type { InventoryProduct }   from '@/lib/actions/inventory';

interface Props {
    product: InventoryProduct;
    onClose: () => void;
    onSaved: () => void;
}

const REASONS = [
    { value: 'إضافة مخزون', label: 'إضافة مخزون'  },
    { value: 'تلف',          label: 'تلف'           },
    { value: 'إرجاع',        label: 'إرجاع'         },
    { value: 'تعديل يدوي',  label: 'تعديل يدوي'    },
    { value: 'طلب مُسلَّم', label: 'طلب مُسلَّم'   },
];

export default function StockAdjustModal({ product, onClose, onSaved }: Props) {
    const [mode,   setMode]   = useState<'+' | '-'>('+');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState(REASONS[0].value);
    const [error,  setError]  = useState('');
    const [saving, startSave] = useTransition();

    const parsedAmount = parseInt(amount, 10);
    const validAmount  = !isNaN(parsedAmount) && parsedAmount > 0;
    const delta        = validAmount ? (mode === '+' ? parsedAmount : -parsedAmount) : 0;
    const previewQty   = product.stock_quantity + delta;
    const previewValid = previewQty >= 0;

    function handleSubmit() {
        if (!validAmount) { setError('أدخل كمية صحيحة'); return; }
        if (!previewValid) { setError('الكمية الناتجة لا يمكن أن تكون سالبة'); return; }

        setError('');
        startSave(async () => {
            try {
                await adjustStock({
                    productId: product.id,
                    amount:    delta,
                    reason,
                });
                onSaved();
            } catch (e: any) {
                setError(e?.message ?? 'حدث خطأ، حاول مجدداً');
            }
        });
    }

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-sm mx-4 rounded-2xl p-6 space-y-5"
                dir="rtl"
                style={{
                    background: '#0d0905',
                    border:     '1px solid rgba(212,175,55,0.15)',
                    boxShadow:  '0 24px 64px rgba(0,0,0,0.7)',
                }}
            >
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-base font-medium" style={{ color: '#EBE5D9' }}>تعديل الكمية</h2>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(212,175,55,0.5)' }}>
                            {product.name_ar} · {product.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-xl leading-none"
                        style={{ color: 'rgba(235,229,217,0.3)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#EBE5D9')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(235,229,217,0.3)')}
                    >
                        ×
                    </button>
                </div>

                {/* Current quantity */}
                <div
                    className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ background: '#120e08', border: '1px solid rgba(212,175,55,0.08)' }}
                >
                    <span className="text-xs" style={{ color: 'rgba(235,229,217,0.5)' }}>الكمية الحالية</span>
                    <span className="tabular-nums font-semibold text-lg" style={{ color: '#D4AF37' }}>
                        {product.stock_quantity.toLocaleString('ar-SA')}
                    </span>
                </div>

                {/* Mode toggle + amount */}
                <div className="space-y-2">
                    <label className="text-xs" style={{ color: 'rgba(235,229,217,0.5)' }}>العملية والكمية</label>
                    <div className="flex gap-2">
                        {/* +/- toggle */}
                        <div
                            className="flex rounded-lg overflow-hidden flex-shrink-0"
                            style={{ border: '1px solid rgba(212,175,55,0.15)' }}
                        >
                            {(['+', '-'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className="px-4 py-2 text-sm font-bold transition-colors duration-100"
                                    style={{
                                        background: mode === m
                                            ? (m === '+' ? 'rgba(74,222,128,0.15)' : 'rgba(255,107,107,0.15)')
                                            : 'transparent',
                                        color: mode === m
                                            ? (m === '+' ? '#4ade80' : '#ff6b6b')
                                            : 'rgba(235,229,217,0.35)',
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        {/* Amount input */}
                        <input
                            type="number"
                            min={1}
                            placeholder="الكمية"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none tabular-nums"
                            style={{
                                background: '#120e08',
                                border:     '1px solid rgba(212,175,55,0.12)',
                                color:      '#EBE5D9',
                                direction:  'ltr',
                                textAlign:  'right',
                            }}
                        />
                    </div>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                    <label className="text-xs" style={{ color: 'rgba(235,229,217,0.5)' }}>السبب</label>
                    <select
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{
                            background: '#120e08',
                            border:     '1px solid rgba(212,175,55,0.12)',
                            color:      '#EBE5D9',
                        }}
                    >
                        {REASONS.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                </div>

                {/* Preview */}
                {validAmount && (
                    <div
                        className="rounded-xl px-4 py-3 flex items-center justify-between"
                        style={{
                            background: previewValid ? 'rgba(74,222,128,0.06)' : 'rgba(255,107,107,0.06)',
                            border:     `1px solid ${previewValid ? 'rgba(74,222,128,0.15)' : 'rgba(255,107,107,0.2)'}`,
                        }}
                    >
                        <span className="text-xs" style={{ color: 'rgba(235,229,217,0.5)' }}>الكمية بعد التعديل</span>
                        <div className="flex items-center gap-2">
                            <span
                                className="text-xs"
                                style={{ color: mode === '+' ? '#4ade80' : '#ff6b6b' }}
                            >
                                {mode === '+' ? '+' : '-'}{parsedAmount}
                            </span>
                            <span className="tabular-nums font-semibold text-lg" style={{ color: previewValid ? '#4ade80' : '#ff6b6b' }}>
                                {previewQty.toLocaleString('ar-SA')}
                            </span>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <p className="text-xs" style={{ color: '#ff6b6b' }}>{error}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border:     '1px solid rgba(255,255,255,0.08)',
                            color:      'rgba(235,229,217,0.6)',
                        }}
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !validAmount || !previewValid}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity disabled:opacity-40"
                        style={{
                            background: 'linear-gradient(135deg,#D4AF37,#B8960C)',
                            color:      '#0d0905',
                        }}
                    >
                        {saving ? '...' : 'حفظ التعديل'}
                    </button>
                </div>
            </div>
        </div>
    );
}
