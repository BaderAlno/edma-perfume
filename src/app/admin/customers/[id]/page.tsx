'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useParams, useRouter }                                       from 'next/navigation';
import {
    getCustomerById,
    getCustomerOrders,
    updateCustomerNotes,
    updateCustomerSegment,
} from '@/lib/actions/customers';
import type { CustomerAdmin, CustomerOrderRow, CustomerSegment } from '@/lib/actions/customers';
import { useCurrency } from '@/context/CurrencyContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const SEGMENT_LABEL: Record<CustomerSegment, string> = { vip: 'VIP', active: 'نشط', inactive: 'غير نشط' };
const SEGMENT_COLOR: Record<CustomerSegment, string> = { vip: '#D4AF37', active: '#4ade80', inactive: 'rgba(235,229,217,0.35)' };
const SEGMENT_BG:    Record<CustomerSegment, string> = { vip: 'rgba(212,175,55,0.12)', active: 'rgba(74,222,128,0.1)', inactive: 'rgba(235,229,217,0.06)' };

const STATUS_LABEL: Record<string, string> = {
    pending: 'معلق', processing: 'قيد التنفيذ', shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغي',
};
const STATUS_COLOR: Record<string, string> = {
    pending: '#fbbf24', processing: '#60a5fa', shipped: '#34d399', delivered: '#4ade80', cancelled: '#ff6b6b',
};
const SOURCE_LABEL: Record<string, string> = { website: 'الموقع', whatsapp: 'واتساب', instagram: 'انستغرام' };
const SOURCE_COLOR: Record<string, string> = { website: '#D4AF37', whatsapp: '#25D366', instagram: '#E1306C' };

const NOTES_AUTOSAVE_DELAY = 900; // ms

function Spinner({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" style={{ animationDuration: '0.8s' }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="2.5" />
            <path d="M12 2 a10 10 0 0 1 10 10" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CustomerProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { formatPrice } = useCurrency();
    const id     = params?.id as string;

    const [customer, setCustomer] = useState<CustomerAdmin | null>(null);
    const [orders,   setOrders]   = useState<CustomerOrderRow[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [notFound, setNotFound] = useState(false);

    // ── Notes auto-save ───────────────────────────────────────────────────────
    const [notes,      setNotes]     = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [, startNoteSave]           = useTransition();
    const notesTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Segment override ──────────────────────────────────────────────────────
    const [, startSegUpdate]  = useTransition();
    const [segSaving, setSegSaving] = useState(false);

    // ── Load ──────────────────────────────────────────────────────────────────

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        const [c, o] = await Promise.all([getCustomerById(id), getCustomerOrders(id)]);
        if (!c) { setNotFound(true); setLoading(false); return; }
        setCustomer(c);
        setNotes(c.notes ?? '');
        setOrders(o);
        setLoading(false);
    }, [id]);

    useEffect(() => { load(); }, [load]);

    // Cleanup timer on unmount
    useEffect(() => () => { if (notesTimerRef.current) clearTimeout(notesTimerRef.current); }, []);

    // ── Notes handler with debounce ───────────────────────────────────────────

    function handleNotesChange(value: string) {
        setNotes(value);
        setSaveStatus('idle');
        if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
        notesTimerRef.current = setTimeout(() => {
            setSaveStatus('saving');
            startNoteSave(async () => {
                try {
                    await updateCustomerNotes(id, value);
                    setSaveStatus('saved');
                    setTimeout(() => setSaveStatus('idle'), 2500);
                } catch {
                    setSaveStatus('error');
                }
            });
        }, NOTES_AUTOSAVE_DELAY);
    }

    // ── Segment override ──────────────────────────────────────────────────────

    async function handleSegmentChange(seg: CustomerSegment) {
        if (!customer || seg === customer.segment) return;
        setSegSaving(true);
        try {
            await updateCustomerSegment(id, seg);
            setCustomer(prev => prev ? { ...prev, segment: seg } : prev);
        } finally {
            setSegSaving(false);
        }
    }

    // ── Derived stats ─────────────────────────────────────────────────────────

    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalRevenue    = deliveredOrders.reduce((s, o) => s + o.total_amount, 0);
    const avgOrder        = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;
    const cancelledCount  = orders.filter(o => o.status === 'cancelled').length;

    // ── Loading / not found ───────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner size={32} />
            </div>
        );
    }

    if (notFound || !customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4" dir="rtl">
                <p className="text-sm" style={{ color: 'rgba(235,229,217,0.5)' }}>العميل غير موجود</p>
                <button
                    onClick={() => router.push('/admin/customers')}
                    className="text-xs px-4 py-2 rounded-lg"
                    style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37' }}
                >
                    ← العودة إلى قائمة العملاء
                </button>
            </div>
        );
    }

    const whatsappMsg = encodeURIComponent(`مرحباً ${customer.name}، `);
    const whatsappUrl = customer.phone
        ? `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${whatsappMsg}`
        : null;

    return (
        <div className="p-6 space-y-6 max-w-[1200px]" dir="rtl">

            {/* ── Breadcrumb ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(212,175,55,0.45)' }}>
                <button onClick={() => router.push('/admin/customers')} className="hover:text-[#D4AF37] transition-colors">
                    العملاء
                </button>
                <span>/</span>
                <span style={{ color: 'rgba(235,229,217,0.6)' }}>{customer.name}</span>
            </div>

            {/* ── Profile header ─────────────────────────────────────────── */}
            <div
                className="rounded-2xl p-6"
                style={{ background: '#120e08', border: '1px solid rgba(212,175,55,0.12)' }}
            >
                <div className="flex flex-wrap items-start justify-between gap-4">
                    {/* Left: avatar + info */}
                    <div className="flex items-center gap-4">
                        {/* Big avatar */}
                        <div
                            className="flex items-center justify-center rounded-2xl text-xl font-semibold flex-shrink-0"
                            style={{
                                width:      60, height: 60,
                                background: SEGMENT_BG[customer.segment],
                                border:     `1.5px solid ${SEGMENT_COLOR[customer.segment]}55`,
                                color:      SEGMENT_COLOR[customer.segment],
                            }}
                        >
                            {customer.name.trim().split(' ').slice(0, 2).map(w => w[0]).join('')}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-light" style={{ color: '#EBE5D9' }}>{customer.name}</h1>
                                <SegmentPill segment={customer.segment} />
                            </div>
                            <div className="flex flex-wrap gap-3 mt-1.5">
                                {customer.phone && (
                                    <span className="text-xs tabular-nums" style={{ color: 'rgba(235,229,217,0.5)' }}>
                                        📞 {customer.phone}
                                    </span>
                                )}
                                {customer.email && (
                                    <span className="text-xs" style={{ color: 'rgba(235,229,217,0.5)' }}>
                                        ✉ {customer.email}
                                    </span>
                                )}
                                {customer.city && (
                                    <span className="text-xs" style={{ color: 'rgba(235,229,217,0.5)' }}>
                                        📍 {customer.city}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] mt-1" style={{ color: 'rgba(235,229,217,0.25)' }}>
                                عميل منذ {new Date(customer.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' })}
                            </p>
                        </div>
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex flex-wrap gap-2">
                        {whatsappUrl && (
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                                style={{
                                    background: 'rgba(37,211,102,0.1)',
                                    border:     '1px solid rgba(37,211,102,0.25)',
                                    color:      '#25D366',
                                }}
                            >
                                <WhatsAppIcon />
                                تواصل
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Stats grid ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'إجمالي الطلبات',     value: orders.length,                         suffix: '',      color: '#60a5fa' },
                    { label: 'طلبات مُسلَّمة',      value: deliveredOrders.length,               suffix: '',      color: '#4ade80' },
                    { label: 'إجمالي الإنفاق',      value: formatPrice(totalRevenue),             suffix: '',      color: '#D4AF37' },
                    { label: 'متوسط قيمة الطلب',   value: formatPrice(Math.round(avgOrder)),      suffix: '',      color: 'rgba(235,229,217,0.7)' },
                ].map(stat => (
                    <div
                        key={stat.label}
                        className="rounded-xl px-4 py-4"
                        style={{ background: '#120e08', border: '1px solid rgba(212,175,55,0.08)' }}
                    >
                        <p className="text-[10px] tracking-wider uppercase mb-1.5" style={{ color: 'rgba(212,175,55,0.5)' }}>
                            {stat.label}
                        </p>
                        <p className="tabular-nums text-xl font-light" style={{ color: stat.color }}>
                            {stat.value}
                            {stat.suffix && <span className="text-xs mr-1" style={{ color: 'rgba(212,175,55,0.4)' }}>{stat.suffix}</span>}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Main two-column layout ─────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left (2/3): Order history ─────────────────────────────── */}
                <div className="lg:col-span-2 space-y-3">
                    <SectionHeader title="سجل الطلبات" count={orders.length} />

                    <div
                        className="rounded-xl overflow-hidden"
                        style={{ background: '#120e08', border: '1px solid rgba(212,175,55,0.1)' }}
                    >
                        {orders.length === 0 ? (
                            <div className="text-center py-10 text-sm" style={{ color: 'rgba(235,229,217,0.3)' }}>
                                لا توجد طلبات بعد
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
                                            {['رقم الطلب', 'المنتج', 'الكمية', 'المبلغ', 'المصدر', 'الحالة', 'التاريخ'].map(h => (
                                                <th key={h} className="px-4 pb-3 pt-4 text-right font-normal text-xs tracking-wider"
                                                    style={{ color: 'rgba(212,175,55,0.5)' }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(o => (
                                            <tr key={o.id}
                                                style={{ borderBottom: '1px solid rgba(212,175,55,0.05)' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.02)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <td className="px-4 py-3 tabular-nums text-xs" style={{ color: 'rgba(212,175,55,0.8)' }}>
                                                    {o.order_number}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-xs" style={{ color: '#EBE5D9' }}>{o.product_name_ar ?? o.product_name ?? '—'}</p>
                                                    {o.product_name_ar && o.product_name && (
                                                        <p className="text-[11px]" style={{ color: 'rgba(235,229,217,0.35)' }}>{o.product_name}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 tabular-nums text-xs text-center" style={{ color: 'rgba(235,229,217,0.6)' }}>
                                                    {o.quantity}
                                                </td>
                                                <td className="px-4 py-3 tabular-nums text-xs" style={{ color: '#EBE5D9' }}>
                                                    {formatPrice(Number(o.total_amount))}
                                                </td>
                                                <td className="px-4 py-3 text-xs" style={{ color: SOURCE_COLOR[o.source] ?? '#888' }}>
                                                    {SOURCE_LABEL[o.source] ?? o.source}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium"
                                                        style={{
                                                            background: `${STATUS_COLOR[o.status] ?? '#888'}22`,
                                                            color:      STATUS_COLOR[o.status] ?? '#888',
                                                        }}
                                                    >
                                                        {STATUS_LABEL[o.status] ?? o.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 tabular-nums text-[11px]" style={{ color: 'rgba(235,229,217,0.35)' }}>
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

                    {/* Cancelled note */}
                    {cancelledCount > 0 && (
                        <p className="text-xs px-1" style={{ color: 'rgba(255,107,107,0.6)' }}>
                            {cancelledCount} طلب ملغي غير محتسب في الإنفاق
                        </p>
                    )}
                </div>

                {/* Right (1/3): Segment + Admin Notes ──────────────────────── */}
                <div className="space-y-4">

                    {/* Segment override */}
                    <div
                        className="rounded-xl p-4 space-y-3"
                        style={{ background: '#120e08', border: '1px solid rgba(212,175,55,0.1)' }}
                    >
                        <SectionHeader title="الشريحة" />
                        <p className="text-[11px]" style={{ color: 'rgba(235,229,217,0.35)' }}>
                            يتم التحديث تلقائياً عبر trigger. يمكنك التعديل اليدوي:
                        </p>
                        <div className="space-y-1.5">
                            {(['vip', 'active', 'inactive'] as CustomerSegment[]).map(seg => (
                                <button
                                    key={seg}
                                    onClick={() => handleSegmentChange(seg)}
                                    disabled={segSaving}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-100 disabled:opacity-50"
                                    style={{
                                        background: customer.segment === seg ? SEGMENT_BG[seg]   : 'transparent',
                                        border:     `1px solid ${customer.segment === seg ? `${SEGMENT_COLOR[seg]}44` : 'rgba(255,255,255,0.05)'}`,
                                        color:      customer.segment === seg ? SEGMENT_COLOR[seg] : 'rgba(235,229,217,0.5)',
                                    }}
                                >
                                    <span>
                                        {seg === 'vip' && '★ '}
                                        {SEGMENT_LABEL[seg]}
                                    </span>
                                    {customer.segment === seg && (
                                        <span className="text-[10px] opacity-60">✓ محدد</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div
                            className="rounded-lg px-3 py-2 text-[11px] space-y-0.5"
                            style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.08)' }}
                        >
                            <p style={{ color: 'rgba(212,175,55,0.6)' }}>قواعد التصنيف التلقائي:</p>
                            <p style={{ color: 'rgba(235,229,217,0.35)' }}>★ VIP — إنفاق أكثر من {formatPrice(2000)}</p>
                            <p style={{ color: 'rgba(235,229,217,0.35)' }}>✓ نشط — طلب خلال آخر 30 يوم</p>
                            <p style={{ color: 'rgba(235,229,217,0.35)' }}>— غير نشط — بخلاف ذلك</p>
                        </div>
                    </div>

                    {/* Admin notes — private, auto-save */}
                    <div
                        className="rounded-xl p-4 space-y-3"
                        style={{ background: '#120e08', border: '1px solid rgba(212,175,55,0.1)' }}
                    >
                        <div className="flex items-center justify-between">
                            <SectionHeader title="ملاحظات خاصة" />
                            {/* Save status indicator */}
                            <span className="text-[10px] tabular-nums transition-opacity" style={{
                                color: saveStatus === 'saving' ? 'rgba(212,175,55,0.6)'
                                     : saveStatus === 'saved'  ? '#4ade80'
                                     : saveStatus === 'error'  ? '#ff6b6b'
                                     : 'transparent',
                            }}>
                                {saveStatus === 'saving' && 'جاري الحفظ...'}
                                {saveStatus === 'saved'  && '✓ تم الحفظ'}
                                {saveStatus === 'error'  && '✗ خطأ'}
                            </span>
                        </div>

                        <p className="text-[11px]" style={{ color: 'rgba(235,229,217,0.3)' }}>
                            هذه الملاحظات خاصة بالإدارة فقط ولا تظهر للعميل. تُحفظ تلقائياً.
                        </p>

                        <textarea
                            value={notes}
                            onChange={e => handleNotesChange(e.target.value)}
                            rows={7}
                            placeholder="ملاحظات خاصة عن هذا العميل، تفضيلاته، أي معلومات مهمة..."
                            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                            style={{
                                background:  '#0d0905',
                                border:      `1px solid ${saveStatus === 'saving' ? 'rgba(212,175,55,0.3)' : saveStatus === 'saved' ? 'rgba(74,222,128,0.3)' : 'rgba(212,175,55,0.12)'}`,
                                color:       '#EBE5D9',
                                lineHeight:  1.65,
                                transition:  'border-color 0.2s',
                            }}
                        />

                        <p className="text-[10px]" style={{ color: 'rgba(235,229,217,0.2)' }}>
                            تُحفظ تلقائياً بعد التوقف عن الكتابة
                        </p>
                    </div>

                    {/* Last order info */}
                    {customer.last_order_at && (
                        <div
                            className="rounded-xl px-4 py-3"
                            style={{ background: '#120e08', border: '1px solid rgba(212,175,55,0.08)' }}
                        >
                            <p className="text-[10px] tracking-wider uppercase mb-1" style={{ color: 'rgba(212,175,55,0.45)' }}>
                                آخر طلب
                            </p>
                            <p className="text-sm tabular-nums" style={{ color: 'rgba(235,229,217,0.7)' }}>
                                {new Date(customer.last_order_at).toLocaleDateString('ar-SA', {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                })}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count?: number }) {
    return (
        <div className="flex items-center gap-2">
            <p className="text-xs font-medium tracking-wider uppercase" style={{ color: 'rgba(212,175,55,0.55)' }}>
                {title}
            </p>
            {count !== undefined && (
                <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full tabular-nums"
                    style={{ background: 'rgba(212,175,55,0.1)', color: 'rgba(212,175,55,0.7)' }}
                >
                    {count}
                </span>
            )}
        </div>
    );
}

function SegmentPill({ segment }: { segment: CustomerSegment }) {
    return (
        <span
            className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
            style={{
                background: SEGMENT_BG[segment],
                color:      SEGMENT_COLOR[segment],
                border:     `1px solid ${SEGMENT_COLOR[segment]}33`,
            }}
        >
            {segment === 'vip' && '★ '}{SEGMENT_LABEL[segment]}
        </span>
    );
}

function WhatsAppIcon() {
    return (
        <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
        </svg>
    );
}
