'use client';

import { useState, useTransition, useEffect } from 'react';
import { createBrowserClient }                 from '@supabase/ssr';
import { createOrder }                          from '@/lib/actions/orders';
import type { Database }                        from '@/lib/database.types';
import { useCurrency }                          from '@/context/CurrencyContext';

type Supabase = ReturnType<typeof createBrowserClient<Database>>;

interface Props {
    onClose:  () => void;
    onCreated: () => void;
}

interface CustomerRow { id: string; name: string; phone: string }
interface ProductRow  { id: string; name: string; price_sar: number }

const SOURCES = [
    { value: 'website',   label: 'الموقع'     },
    { value: 'whatsapp',  label: 'واتساب'     },
    { value: 'instagram', label: 'انستغرام'   },
] as const;

export default function AddOrderModal({ onClose, onCreated }: Props) {
    const { formatPrice } = useCurrency();
    const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');

    const [customers, setCustomers] = useState<CustomerRow[]>([]);
    const [products,  setProducts]  = useState<ProductRow[]>([]);

    const [customerId, setCustomerId] = useState('');
    const [productId,  setProductId]  = useState('');
    const [quantity,   setQuantity]   = useState(1);
    const [source,     setSource]     = useState<'website' | 'whatsapp' | 'instagram'>('website');
    const [notes,      setNotes]      = useState('');

    // Auto-fill total from product price × quantity
    const selectedProduct = products.find(p => p.id === productId);
    const total = selectedProduct ? selectedProduct.price_sar * quantity : 0;

    useEffect(() => {
        supabase.from('customers').select('id, name, phone').order('name')
            .then(({ data }) => setCustomers(data ?? []));
        supabase.from('products').select('id, name, price_sar').eq('is_active', true).order('name')
            .then(({ data }) => setProducts(data ?? []));
    }, [supabase]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (!customerId || !productId) { setError('يرجى اختيار العميل والمنتج'); return; }

        startTransition(async () => {
            try {
                await createOrder({
                    customer_id:  customerId,
                    product_id:   productId,
                    quantity,
                    total_amount: total,
                    source,
                    notes: notes || undefined,
                });
                onCreated();
                onClose();
            } catch (err) {
                setError((err as Error).message);
            }
        });
    }

    const inputStyle = {
        background: '#0d0905',
        border:     '1px solid rgba(212,175,55,0.2)',
        color:      '#EBE5D9',
        borderRadius: 8,
        padding:    '10px 12px',
        fontSize:   14,
        width:      '100%',
        outline:    'none',
    } as const;

    const labelStyle = {
        display:    'block',
        fontSize:   11,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color:      'rgba(212,175,55,0.55)',
        marginBottom: 6,
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full"
                style={{ maxWidth: 460 }}
            >
                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl p-7 space-y-5"
                    style={{
                        background: '#120e08',
                        border:     '1px solid rgba(212,175,55,0.15)',
                        boxShadow:  '0 40px 100px rgba(0,0,0,0.7)',
                    }}
                >
                    {/* Title */}
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-base font-light" style={{ color: '#EBE5D9' }}>
                            إضافة طلب يدوي
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ color: 'rgba(235,229,217,0.4)', fontSize: 18 }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Customer */}
                    <div>
                        <label style={labelStyle}>العميل</label>
                        <select
                            required
                            value={customerId}
                            onChange={e => setCustomerId(e.target.value)}
                            style={inputStyle}
                        >
                            <option value="">اختر عميلاً...</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                            ))}
                        </select>
                    </div>

                    {/* Product */}
                    <div>
                        <label style={labelStyle}>المنتج</label>
                        <select
                            required
                            value={productId}
                            onChange={e => setProductId(e.target.value)}
                            style={inputStyle}
                        >
                            <option value="">اختر منتجاً...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.price_sar)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Quantity + Source row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label style={labelStyle}>الكمية</label>
                            <input
                                type="number"
                                min={1}
                                required
                                value={quantity}
                                onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>المصدر</label>
                            <select
                                value={source}
                                onChange={e => setSource(e.target.value as typeof source)}
                                style={inputStyle}
                            >
                                {SOURCES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Total (read-only) */}
                    {selectedProduct && (
                        <div
                            className="rounded-lg px-4 py-3 flex justify-between text-sm"
                            style={{
                                background: 'rgba(212,175,55,0.06)',
                                border:     '1px solid rgba(212,175,55,0.12)',
                            }}
                        >
                            <span style={{ color: 'rgba(212,175,55,0.6)' }}>الإجمالي</span>
                            <span style={{ color: '#D4AF37' }} className="tabular-nums font-medium">
                                {formatPrice(total)}
                            </span>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label style={labelStyle}>ملاحظات (اختياري)</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            style={{ ...inputStyle, resize: 'vertical' }}
                            placeholder="أي تعليمات خاصة..."
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <p
                            className="text-sm text-center rounded-lg py-2 px-3"
                            style={{
                                color:      '#ff6b6b',
                                background: 'rgba(255,107,107,0.1)',
                                border:     '1px solid rgba(255,107,107,0.2)',
                            }}
                        >
                            {error}
                        </p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-3.5 rounded-xl text-sm font-medium tracking-widest transition-all duration-150 disabled:opacity-50"
                        style={{
                            background: 'linear-gradient(135deg,#D4AF37,#B8960C)',
                            color:      '#0d0905',
                        }}
                    >
                        {isPending ? '...' : 'إنشاء الطلب'}
                    </button>
                </form>
            </div>
        </>
    );
}
