import { useCurrency } from '@/context/CurrencyContext';
import type { OrderWithDetails } from '@/lib/database.types';

interface Props {
    orders: OrderWithDetails[];
}

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
    pending:    { label: 'معلق',      bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24' },
    processing: { label: 'قيد التنفيذ', bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa' },
    shipped:    { label: 'تم الشحن',   bg: 'rgba(52,211,153,0.12)',  color: '#34d399' },
    delivered:  { label: 'تم التسليم', bg: 'rgba(74,222,128,0.12)',  color: '#4ade80' },
    cancelled:  { label: 'ملغي',       bg: 'rgba(255,107,107,0.12)', color: '#ff6b6b' },
};

const SOURCE_STYLES: Record<string, { label: string; color: string }> = {
    website:   { label: 'الموقع',    color: '#D4AF37' },
    whatsapp:  { label: 'واتساب',   color: '#25D366' },
    instagram: { label: 'انستغرام', color: '#E1306C' },
};

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_STYLES[status] ?? { label: status, bg: 'rgba(255,255,255,0.08)', color: '#EBE5D9' };
    return (
        <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{ background: s.bg, color: s.color }}
        >
            {s.label}
        </span>
    );
}

function SourceBadge({ source }: { source: string }) {
    const s = SOURCE_STYLES[source] ?? { label: source, color: 'rgba(235,229,217,0.5)' };
    return (
        <span className="text-xs" style={{ color: s.color }}>
            {s.label}
        </span>
    );
}

export default function OrdersTable({ orders }: Props) {
    const { formatPrice } = useCurrency();

    if (!orders.length) {
        return (
            <div
                className="text-sm text-center py-10"
                style={{ color: 'rgba(235,229,217,0.3)' }}
            >
                لا توجد طلبات بعد
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
                        {['رقم الطلب', 'العميل', 'المنتج', 'المبلغ', 'المصدر', 'الحالة', 'التاريخ'].map(h => (
                            <th
                                key={h}
                                className="pb-3 pt-1 text-right font-normal text-xs tracking-wider"
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
                            style={{ borderBottom: '1px solid rgba(212,175,55,0.05)' }}
                            className="transition-colors duration-100 hover:bg-[rgba(212,175,55,0.03)]"
                        >
                            <td className="py-3 pr-0 tabular-nums" style={{ color: 'rgba(212,175,55,0.8)' }}>
                                #{o.order_number}
                            </td>
                            <td className="py-3" style={{ color: '#EBE5D9' }}>
                                {o.customer_name ?? '—'}
                            </td>
                            <td className="py-3" style={{ color: 'rgba(235,229,217,0.65)' }}>
                                {o.product_name ?? '—'}
                            </td>
                            <td className="py-3 tabular-nums font-medium" style={{ color: '#EBE5D9' }}>
                                {formatPrice(Number(o.total_amount))}
                            </td>
                            <td className="py-3">
                                <SourceBadge source={o.source} />
                            </td>
                            <td className="py-3">
                                <StatusBadge status={o.status} />
                            </td>
                            <td className="py-3 tabular-nums text-xs" style={{ color: 'rgba(235,229,217,0.4)' }}>
                                {new Date(o.created_at).toLocaleDateString('ar-SA', {
                                    year: 'numeric', month: 'short', day: 'numeric',
                                })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
