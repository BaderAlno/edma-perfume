'use client';

import { useEffect, useState } from 'react';
import { getAllProductsAdmin, type ProductAdmin } from '@/lib/actions/products';
import { createCoupon } from '@/lib/actions/coupons';
import { useCurrency } from '@/context/CurrencyContext';

export default function AddCouponModal({
    isOpen,
    onClose,
    onSuccess
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const { currency } = useCurrency();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [code, setCode] = useState('');
    const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
    const [value, setValue] = useState('');
    const [minOrder, setMinOrder] = useState('');
    const [maxUses, setMaxUses] = useState('');
    const [expiresAt, setExpiresAt] = useState('');

    const [products, setProducts] = useState<ProductAdmin[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            getAllProductsAdmin().then(setProducts).catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCode(result);
    };

    const toggleProduct = (id: string) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await createCoupon({
                code: code.trim().toUpperCase(),
                type,
                value: Number(value),
                min_order: minOrder ? Number(minOrder) : null,
                max_uses: maxUses ? Number(maxUses) : null,
                expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
                applicable_product_ids: selectedProducts.length > 0 ? selectedProducts : null,
                is_active: true
            });
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
            <div className="w-full max-w-2xl bg-[#0d0905] border border-[#D4AF37]/20 rounded-2xl shadow-2xl overflow-hidden text-[#EBE5D9]">
                <div className="p-6 border-b border-[#D4AF37]/10 flex justify-between items-center bg-[#15110c]">
                    <h2 className="text-xl font-serif text-[#D4AF37]">إضافة كوبون جديد</h2>
                    <button type="button" onClick={onClose} className="text-[#EBE5D9]/50 hover:text-white transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm text-right">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">

                        {/* Code */}
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label htmlFor="coupon-code" className="text-sm text-[#EBE5D9]/70">رمز الكوبون</label>
                            <div className="flex gap-2">
                                <input
                                    id="coupon-code"
                                    name="code"
                                    required
                                    value={code}
                                    onChange={e => setCode(e.target.value.toUpperCase())}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/50 text-left font-mono uppercase"
                                    placeholder="SUMMER25"
                                />
                                <button type="button" onClick={generateCode} className="px-6 py-3 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] rounded-xl text-sm transition-colors whitespace-nowrap">
                                    توليد تلقائي
                                </button>
                            </div>
                        </div>

                        {/* Type & Value */}
                        <div className="space-y-2">
                            <label className="text-sm text-[#EBE5D9]/70">نوع الخصم</label>
                            <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
                                <button type="button" onClick={() => setType('percentage')} className={`flex-1 py-2 text-sm rounded-lg transition-colors ${type === 'percentage' ? 'bg-[#D4AF37] text-black' : 'text-white/70 hover:text-white'}`}>نسبة مئوية (%)</button>
                                <button type="button" onClick={() => setType('fixed')} className={`flex-1 py-2 text-sm rounded-lg transition-colors ${type === 'fixed' ? 'bg-[#D4AF37] text-black' : 'text-white/70 hover:text-white'}`}>مبلغ ثابت</button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="coupon-value" className="text-sm text-[#EBE5D9]/70">قيمة الخصم</label>
                            <input
                                id="coupon-value"
                                name="value"
                                required
                                type="number"
                                step="0.01"
                                min="0"
                                value={value}
                                onChange={e => setValue(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37]/50"
                            />
                        </div>

                        {/* Limits */}
                        <div className="space-y-2">
                            <label htmlFor="min-order" className="text-sm text-[#EBE5D9]/70">الحد الأدنى للطلب ({currency}) - اختياري</label>
                            <input
                                id="min-order"
                                name="minOrder"
                                type="number"
                                step="0.01"
                                min="0"
                                value={minOrder}
                                onChange={e => setMinOrder(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37]/50"
                                placeholder="0"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="max-uses" className="text-sm text-[#EBE5D9]/70">الحد الأقصى للاستخدام (اختياري)</label>
                            <input
                                id="max-uses"
                                name="maxUses"
                                type="number"
                                min="1"
                                value={maxUses}
                                onChange={e => setMaxUses(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37]/50"
                                placeholder="بدون حد"
                            />
                        </div>

                        {/* Date */}
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label htmlFor="expires-at" className="text-sm text-[#EBE5D9]/70">تاريخ الانتهاء (اختياري)</label>
                            <input
                                id="expires-at"
                                name="expiresAt"
                                type="datetime-local"
                                value={expiresAt}
                                onChange={e => setExpiresAt(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37]/50 text-left"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>

                        {/* Products Multi-select */}
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-sm text-[#EBE5D9]/70">تطبيق على منتجات محددة (اختياري، اترك فارغاً للتطبيق على الكل)</label>
                            <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto p-3 bg-white/5 border border-white/10 rounded-xl">
                                {products.map(p => (
                                    <label key={p.id} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={selectedProducts.includes(p.id)}
                                            onChange={() => toggleProduct(p.id)}
                                        />
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedProducts.includes(p.id) ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/20 group-hover:border-[#D4AF37]/50'}`}>
                                            {selectedProducts.includes(p.id) && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-sm text-white/80 select-none group-hover:text-white transition-colors">
                                            {p.name_ar || p.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="pt-8 flex gap-4">
                        <button type="submit" disabled={loading} className="flex-1 py-4 bg-[#D4AF37] text-black font-medium rounded-xl hover:bg-[#E5C84A] transition-colors disabled:opacity-50">
                            {loading ? 'جاري الحفظ...' : 'إنشاء الكوبون'}
                        </button>
                        <button type="button" onClick={onClose} className="px-8 py-4 bg-white/5 text-white/70 hover:text-white border border-white/10 rounded-xl transition-colors">
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
