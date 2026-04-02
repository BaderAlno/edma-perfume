'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatus, deleteOrder } from '@/lib/actions/orders';
import type { OrderWithDetails }          from '@/lib/database.types';
import type { Database }                  from '@/lib/database.types';
import { useCurrency }                    from '@/context/CurrencyContext';

type OrderStatus = Database['public']['Enums']['order_status'];

const STATUSES: { value: OrderStatus; label: string }[] = [
    { value: 'pending',    label: 'معلق'         },
    { value: 'processing', label: 'قيد التنفيذ'  },
    { value: 'shipped',    label: 'تم الشحن'     },
    { value: 'delivered',  label: 'تم التسليم'   },
    { value: 'cancelled',  label: 'ملغي'          },
];

const STATUS_COLOR: Record<OrderStatus, string> = {
    pending:    '#fbbf24',
    processing: '#60a5fa',
    shipped:    '#34d399',
    delivered:  '#4ade80',
    cancelled:  '#ff6b6b',
};

interface Props {
    order:    OrderWithDetails | null;
    onClose:  () => void;
    onUpdate: () => void;
}

export default function OrderDetailPanel({ order, onClose, onUpdate }: Props) {
    const { formatPrice } = useCurrency();
    const [isPending, startTransition] = useTransition();
    const [confirmDelete, setConfirmDelete] = useState(false);

    if (!order) return null;

    function handleStatusChange(status: OrderStatus) {
        if (!order) return;
        startTransition(async () => {
            await updateOrderStatus(order.id, status);
            onUpdate();
        });
    }

    function handleDelete() {
        if (!order) return;
        startTransition(async () => {
            await deleteOrder(order.id);
            onClose();
            onUpdate();
        });
    }

    const whatsappMsg = encodeURIComponent(
        `مرحباً ${order.customer_name ?? ''}، طلبك رقم #${order.order_number} — ${order.product_name ?? ''}. المبلغ: ${formatPrice(order.total_amount)}.`
    );
    const whatsappUrl = order.customer_phone
        ? `https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${whatsappMsg}`
        : null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className="fixed top-0 left-0 h-full z-50 flex flex-col overflow-y-auto"
                style={{
                    width: 380,
                    background: '#120e08',
                    borderRight: '1px solid rgba(212,175,55,0.12)',
                    boxShadow: '-24px 0 80px rgba(0,0,0,0.6)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}
                >
                    <div>
                        <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>
                            تفاصيل الطلب
                        </p>
                        <p className="text-lg mt-0.5" style={{ color: '#D4AF37' }}>
                            #{order.order_number}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                        style={{ color: 'rgba(235,229,217,0.4)', background: 'rgba(235,229,217,0.05)' }}
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 px-6 py-5 space-y-6">
                    {/* Status badge + selector */}
                    <div>
                        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(212,175,55,0.45)' }}>
                            الحالة
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {STATUSES.map(s => {
                                const active = order.status === s.value;
                                return (
                                    <button
                                        key={s.value}
                                        disabled={isPending}
                                        onClick={() => handleStatusChange(s.value)}
                                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 disabled:opacity-50"
                                        style={{
                                            background: active
                                                ? `${STATUS_COLOR[s.value]}22`
                                                : 'rgba(255,255,255,0.04)',
                                            border: active
                                                ? `1px solid ${STATUS_COLOR[s.value]}55`
                                                : '1px solid rgba(255,255,255,0.06)',
                                            color: active
                                                ? STATUS_COLOR[s.value]
                                                : 'rgba(235,229,217,0.45)',
                                        }}
                                    >
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Info rows */}
                    {[
                        { label: 'العميل',   value: order.customer_name  ?? '—' },
                        { label: 'الهاتف',   value: order.customer_phone ?? '—' },
                        { label: 'المنتج',   value: order.product_name   ?? '—' },
                        { label: 'الكمية',   value: String(order.quantity)       },
                        {
                            label: 'المبلغ',
                            value: formatPrice(order.total_amount),
                        },
                        { label: 'المصدر',   value: order.source        },
                        {
                            label: 'التاريخ',
                            value: new Date(order.created_at).toLocaleDateString('ar-SA', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                            }),
                        },
                    ].map(row => (
                        <div key={row.label} className="flex justify-between items-start gap-4">
                            <span className="text-xs" style={{ color: 'rgba(212,175,55,0.5)' }}>{row.label}</span>
                            <span className="text-sm text-right" style={{ color: '#EBE5D9' }}>{row.value}</span>
                        </div>
                    ))}

                    {order.notes && (
                        <div>
                            <p className="text-xs mb-1" style={{ color: 'rgba(212,175,55,0.5)' }}>ملاحظات</p>
                            <p
                                className="text-sm rounded-lg px-3 py-2.5"
                                style={{
                                    color:      'rgba(235,229,217,0.7)',
                                    background: 'rgba(255,255,255,0.03)',
                                    border:     '1px solid rgba(212,175,55,0.06)',
                                }}
                            >
                                {order.notes}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div
                    className="px-6 py-5 space-y-2 flex-shrink-0"
                    style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }}
                >
                    {whatsappUrl && (
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-all duration-150"
                            style={{
                                background: 'rgba(37,211,102,0.12)',
                                border:     '1px solid rgba(37,211,102,0.25)',
                                color:      '#25D366',
                            }}
                        >
                            <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            تواصل عبر واتساب
                        </a>
                    )}

                    {!confirmDelete ? (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            disabled={isPending}
                            className="w-full py-2.5 rounded-xl text-sm transition-all duration-150 disabled:opacity-50"
                            style={{
                                background: 'rgba(255,107,107,0.07)',
                                border:     '1px solid rgba(255,107,107,0.15)',
                                color:      '#ff6b6b',
                            }}
                        >
                            حذف الطلب
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleDelete}
                                disabled={isPending}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                                style={{ background: '#ff6b6b', color: '#0d0905' }}
                            >
                                تأكيد الحذف
                            </button>
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="flex-1 py-2.5 rounded-xl text-sm"
                                style={{
                                    background: 'rgba(235,229,217,0.05)',
                                    border:     '1px solid rgba(235,229,217,0.1)',
                                    color:      'rgba(235,229,217,0.6)',
                                }}
                            >
                                إلغاء
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
