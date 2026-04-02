'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import Image from 'next/image';
import { createProduct, updateProduct, uploadProductImage } from '@/lib/actions/products';
import type { ProductAdmin } from '@/lib/actions/products';
import { useCurrency } from '@/context/CurrencyContext';

interface Props {
    product?: ProductAdmin | null;   // null = add mode
    onClose: () => void;
    onSaved: () => void;
}

const EMPTY_FORM = {
    name: '',
    name_ar: '',
    price_sar: '',
    stock_quantity: '',
    low_stock_threshold: '10',
    description_en: '',
    description_ar: '',
    quote_en: '',
    quote_ar: '',
    top_notes: '',
    heart_notes: '',
    base_notes: '',
    is_active: true,
};

const inputStyle = {
    background: '#0d0905',
    border: '1px solid rgba(212,175,55,0.2)',
    color: '#EBE5D9',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    direction: 'rtl' as const,
} as const;

const labelStyle = {
    display: 'block',
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'rgba(212,175,55,0.55)',
    marginBottom: 6,
};

export default function ProductModal({ product, onClose, onSaved }: Props) {
    const { currency } = useCurrency();
    const isEdit = !!product;

    const [form, setForm] = useState({
        name: product?.name ?? EMPTY_FORM.name,
        name_ar: product?.name_ar ?? EMPTY_FORM.name_ar,
        price_sar: product ? String(product.price_sar) : EMPTY_FORM.price_sar,
        stock_quantity: product ? String(product.stock_quantity) : EMPTY_FORM.stock_quantity,
        low_stock_threshold: product ? String(product.low_stock_threshold) : EMPTY_FORM.low_stock_threshold,
        description_en: product?.description_en ?? EMPTY_FORM.description_en,
        description_ar: product?.description_ar ?? EMPTY_FORM.description_ar,
        quote_en: product?.quote_en ?? EMPTY_FORM.quote_en,
        quote_ar: product?.quote_ar ?? EMPTY_FORM.quote_ar,
        top_notes: product?.top_notes ? product.top_notes.join(', ') : EMPTY_FORM.top_notes,
        heart_notes: product?.heart_notes ? product.heart_notes.join(', ') : EMPTY_FORM.heart_notes,
        base_notes: product?.base_notes ? product.base_notes.join(', ') : EMPTY_FORM.base_notes,
        is_active: product?.is_active ?? EMPTY_FORM.is_active,
    });

    // Image state
    const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url ?? null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [error, setError] = useState('');
    const [saving, startSave] = useTransition();

    function set(key: keyof typeof form, value: string | boolean) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    // ── Image pick ────────────────────────────────────────────────────────────
    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setError('يجب اختيار ملف صورة'); return; }
        if (file.size > 5 * 1024 * 1024) { setError('حجم الصورة يجب أن يكون أقل من 5 ميغابايت'); return; }

        setImageFile(file);
        const url = URL.createObjectURL(file);
        setImagePreview(url);
        setError('');
    }

    // Revoke object URLs on unmount to avoid memory leaks
    useEffect(() => {
        return () => {
            if (imageFile && imagePreview?.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imageFile, imagePreview]);

    // ── Submit ────────────────────────────────────────────────────────────────
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        const price = parseFloat(form.price_sar);
        const stock = parseInt(form.stock_quantity, 10);
        const thresh = parseInt(form.low_stock_threshold, 10);

        if (!form.name.trim()) { setError('يرجى إدخال اسم المنتج بالإنجليزية'); return; }
        if (!form.name_ar.trim()) { setError('يرجى إدخال اسم المنتج بالعربية'); return; }
        if (isNaN(price) || price <= 0) { setError('يرجى إدخال سعر صحيح'); return; }
        if (isNaN(stock) || stock < 0) { setError('يرجى إدخال كمية صحيحة'); return; }
        if (isNaN(thresh) || thresh < 0) { setError('يرجى إدخال حد تنبيه صحيح'); return; }

        startSave(async () => {
            try {
                // Upload new image if selected
                let imageUrl: string | null | undefined = undefined;
                if (imageFile) {
                    setUploadingImage(true);
                    try {
                        const fd = new FormData();
                        fd.append('file', imageFile);
                        imageUrl = await uploadProductImage(fd);
                    } finally {
                        setUploadingImage(false);
                    }
                }

                const payload = {
                    name: form.name.trim(),
                    name_ar: form.name_ar.trim(),
                    price_sar: price,
                    stock_quantity: stock,
                    low_stock_threshold: thresh,
                    description_en: form.description_en.trim() || null,
                    description_ar: form.description_ar.trim() || null,
                    quote_en: form.quote_en.trim() || null,
                    quote_ar: form.quote_ar.trim() || null,
                    top_notes: form.top_notes.split(',').map(s => s.trim()).filter(Boolean),
                    heart_notes: form.heart_notes.split(',').map(s => s.trim()).filter(Boolean),
                    base_notes: form.base_notes.split(',').map(s => s.trim()).filter(Boolean),
                    is_active: form.is_active,
                    ...(imageUrl !== undefined ? { image_url: imageUrl } : {}),
                };

                if (isEdit && product) {
                    await updateProduct(product.id, payload);
                } else {
                    await createProduct({
                        ...payload,
                        image_url: imageUrl ?? null,
                    });
                }

                onSaved();
            } catch (err: any) {
                setError(err?.message ?? 'حدث خطأ، حاول مجدداً');
            }
        });
    }

    const isBusy = saving || uploadingImage;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full overflow-y-auto"
                style={{ maxWidth: 560, maxHeight: '92vh' }}
            >
                <form
                    onSubmit={handleSubmit}
                    dir="rtl"
                    className="rounded-2xl p-7 space-y-5 mx-4"
                    style={{
                        background: '#120e08',
                        border: '1px solid rgba(212,175,55,0.15)',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.75)',
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-light" style={{ color: '#EBE5D9' }}>
                                {isEdit ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                            </h2>
                            {isEdit && (
                                <p className="text-xs mt-0.5" style={{ color: 'rgba(212,175,55,0.45)' }}>
                                    {product!.name_ar} · {product!.name}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ color: 'rgba(235,229,217,0.4)', fontSize: 18 }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* ── Image upload ─────────────────────────────────────── */}
                    <div>
                        <label style={labelStyle}>صورة المنتج</label>
                        <div
                            className="relative rounded-xl overflow-hidden cursor-pointer group"
                            style={{
                                height: 160,
                                background: '#0d0905',
                                border: `2px dashed ${imagePreview ? 'rgba(212,175,55,0.2)' : 'rgba(212,175,55,0.12)'}`,
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {imagePreview ? (
                                <>
                                    <Image
                                        src={imagePreview}
                                        alt="معاينة"
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                    {/* Hover overlay */}
                                    <div
                                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ background: 'rgba(0,0,0,0.6)' }}
                                    >
                                        <p className="text-xs" style={{ color: '#D4AF37' }}>تغيير الصورة</p>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center gap-2">
                                    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                                    </svg>
                                    <p className="text-xs" style={{ color: 'rgba(212,175,55,0.45)' }}>
                                        انقر لاختيار صورة
                                    </p>
                                    <p className="text-[10px]" style={{ color: 'rgba(235,229,217,0.25)' }}>
                                        JPG، PNG، WebP · حتى 5 ميغابايت
                                    </p>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* ── Names ────────────────────────────────────────────── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label style={labelStyle}>الاسم بالعربية *</label>
                            <input
                                required
                                type="text"
                                placeholder="مثال: إلينور"
                                value={form.name_ar}
                                onChange={e => set('name_ar', e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ ...labelStyle, direction: 'ltr', textAlign: 'left' }}>
                                الاسم بالإنجليزية *
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Elinor"
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                style={{ ...inputStyle, direction: 'ltr' }}
                            />
                        </div>
                    </div>

                    {/* ── Price + Stock + Threshold ─────────────────────────── */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label style={labelStyle}>السعر ({currency}) *</label>
                            <input
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="450"
                                value={form.price_sar}
                                onChange={e => set('price_sar', e.target.value)}
                                style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>المخزون *</label>
                            <input
                                required
                                type="number"
                                min="0"
                                placeholder="50"
                                value={form.stock_quantity}
                                onChange={e => set('stock_quantity', e.target.value)}
                                style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>حد التنبيه</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="10"
                                value={form.low_stock_threshold}
                                onChange={e => set('low_stock_threshold', e.target.value)}
                                style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                            />
                        </div>
                    </div>

                    {/* ── Fragrance notes ──────────────────────────────────── */}
                    <div>
                        <label style={labelStyle}>ملاحظات العطر بالعربية</label>
                        <textarea
                            rows={3}
                            placeholder={'القمة: برغموت، ليمون\nالقلب: ورد، عود\nالقاعدة: مسك، أمبر'}
                            value={form.description_ar}
                            onChange={e => set('description_ar', e.target.value)}
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </div>
                    <div>
                        <label style={{ ...labelStyle, direction: 'ltr', textAlign: 'left' }}>
                            ملاحظات العطر بالإنجليزية
                        </label>
                        <textarea
                            rows={3}
                            placeholder={'Top: Bergamot, Lemon\nHeart: Rose, Oud\nBase: Musk, Amber'}
                            value={form.description_en}
                            onChange={e => set('description_en', e.target.value)}
                            style={{ ...inputStyle, resize: 'vertical', direction: 'ltr' }}
                        />
                    </div>

                    {/* ── Quotes ────────────────────────────────────────────── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label style={labelStyle}>الاقتباس بالعربية</label>
                            <input
                                type="text"
                                placeholder="اقتباس يصف العطر..."
                                value={form.quote_ar}
                                onChange={e => set('quote_ar', e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ ...labelStyle, direction: 'ltr', textAlign: 'left' }}>
                                Quote (EN)
                            </label>
                            <input
                                type="text"
                                placeholder="A quote describing the perfume..."
                                value={form.quote_en}
                                onChange={e => set('quote_en', e.target.value)}
                                style={{ ...inputStyle, direction: 'ltr' }}
                            />
                        </div>
                    </div>

                    {/* ── Note Tags ──────────────────────────────────────────── */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label style={{ ...labelStyle, direction: 'ltr', textAlign: 'left' }}>Base Notes</label>
                            <input
                                type="text"
                                placeholder="oud, musk..."
                                value={form.base_notes}
                                onChange={e => set('base_notes', e.target.value)}
                                style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }}
                                title="كلمات مفتاحية مفصولة بفاصلة"
                            />
                        </div>
                        <div>
                            <label style={{ ...labelStyle, direction: 'ltr', textAlign: 'left' }}>Heart Notes</label>
                            <input
                                type="text"
                                placeholder="rose, jasmine..."
                                value={form.heart_notes}
                                onChange={e => set('heart_notes', e.target.value)}
                                style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }}
                                title="كلمات مفتاحية مفصولة بفاصلة"
                            />
                        </div>
                        <div>
                            <label style={{ ...labelStyle, direction: 'ltr', textAlign: 'left' }}>Top Notes</label>
                            <input
                                type="text"
                                placeholder="citrus, fresh..."
                                value={form.top_notes}
                                onChange={e => set('top_notes', e.target.value)}
                                style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }}
                                title="كلمات مفتاحية مفصولة بفاصلة"
                            />
                        </div>
                    </div>

                    {/* ── Active toggle ─────────────────────────────────────── */}
                    <div className="flex items-center justify-between py-1">
                        <div>
                            <p className="text-sm" style={{ color: '#EBE5D9' }}>حالة المنتج</p>
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(235,229,217,0.4)' }}>
                                {form.is_active ? 'ظاهر في المتجر' : 'مخفي من المتجر'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => set('is_active', !form.is_active)}
                            style={{
                                width: 44, height: 24, borderRadius: 12,
                                background: form.is_active ? '#4ade80' : 'rgba(255,255,255,0.12)',
                                border: 'none', cursor: 'pointer', position: 'relative',
                                transition: 'background 0.2s',
                            }}
                        >
                            <span
                                style={{
                                    display: 'block',
                                    width: 16, height: 16,
                                    borderRadius: '50%',
                                    background: '#fff',
                                    position: 'absolute',
                                    top: 4,
                                    left: form.is_active ? 24 : 4,
                                    transition: 'left 0.2s',
                                }}
                            />
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <p
                            className="text-sm text-center rounded-lg py-2 px-3"
                            style={{
                                color: '#ff6b6b',
                                background: 'rgba(255,107,107,0.1)',
                                border: '1px solid rgba(255,107,107,0.2)',
                            }}
                        >
                            {error}
                        </p>
                    )}

                    {/* Submit */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isBusy}
                            className="flex-1 py-3 rounded-xl text-sm disabled:opacity-40"
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: 'rgba(235,229,217,0.6)',
                            }}
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={isBusy}
                            className="flex-1 py-3 rounded-xl text-sm font-medium tracking-widest transition-all disabled:opacity-50"
                            style={{
                                background: 'linear-gradient(135deg,#D4AF37,#B8960C)',
                                color: '#0d0905',
                            }}
                        >
                            {uploadingImage ? 'جاري رفع الصورة...' : saving ? '...' : isEdit ? 'حفظ التعديلات' : 'إضافة المنتج'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
