'use client';

import { useEffect, useState } from 'react';
import { getCouponsAdmin, toggleCouponStatus, deleteCoupon, getCouponAnalytics, CouponRow } from '@/lib/actions/coupons';
import AddCouponModal from '@/components/admin/AddCouponModal';
import { useCurrency } from '@/context/CurrencyContext';

export default function CouponsPage() {
    const { formatPrice } = useCurrency();
    const [coupons, setCoupons] = useState<CouponRow[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cData, aData] = await Promise.all([
                getCouponsAdmin(),
                getCouponAnalytics()
            ]);
            setCoupons(cData);
            setAnalytics(aData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await toggleCouponStatus(id, !currentStatus);
            setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
        } catch (e) {
            alert('Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;
        try {
            await deleteCoupon(id);
            setCoupons(prev => prev.filter(c => c.id !== id));
        } catch (e) {
            alert('Failed to delete coupon');
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        alert('تم النسخ!');
    };

    if (loading) return <div className="p-8 text-center text-[#D4AF37] font-serif text-xl">Loading...</div>;

    return (
        <div className="p-8 space-y-10 rtl text-right" dir="rtl">

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-serif text-[#EBE5D9] mb-2">الكوبونات والخصومات</h1>
                    <p className="text-[#EBE5D9]/50">إدارة الرموز الترويجية وتحليل أدائها</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-6 py-3 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#E5C84A] transition-colors flex items-center gap-2"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    كوبون جديد
                </button>
            </div>

            {/* Analytics Section */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#15110c] p-6 rounded-2xl border border-[#D4AF37]/20 flex flex-col justify-center">
                        <p className="text-sm font-medium text-[#EBE5D9]/50 mb-1">إجمالي الكوبونات المستخدمة</p>
                        <p className="text-4xl font-serif text-[#D4AF37]">{analytics.totalUsage}</p>
                    </div>
                    <div className="bg-[#15110c] p-6 rounded-2xl border border-[#D4AF37]/20 flex flex-col justify-center">
                        <p className="text-sm font-medium text-[#EBE5D9]/50 mb-1">الكوبون الأكثر استخداماً</p>
                        <p className="text-xl font-mono text-[#D4AF37] mb-1">{analytics.topByUsage[0]?.code || '-'}</p>
                        <p className="text-xs text-[#EBE5D9]/40">{analytics.topByUsage[0]?.uses_count || 0} استخدام</p>
                    </div>
                    <div className="bg-[#15110c] p-6 rounded-2xl border border-[#D4AF37]/20 flex flex-col justify-center">
                        <p className="text-sm font-medium text-[#EBE5D9]/50 mb-1">أعلى إيرادات بواسطة كوبون</p>
                        <p className="text-xl font-mono text-[#D4AF37] mb-1">{analytics.topByRevenue[0]?.code || '-'}</p>
                        <p className="text-xs text-[#EBE5D9]/40">{formatPrice(analytics.topByRevenue[0]?.revenue_generated || 0)}</p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-[#15110c] rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm text-[#EBE5D9]/80">
                    <thead className="bg-[#0A0806] border-b border-white/5 text-[#EBE5D9]/50">
                        <tr>
                            <th className="px-6 py-4 font-medium text-right">الرمز</th>
                            <th className="px-6 py-4 font-medium text-right">الخصم</th>
                            <th className="px-6 py-4 font-medium text-center">الاستخدام</th>
                            <th className="px-6 py-4 font-medium text-right">الانتهاء</th>
                            <th className="px-6 py-4 font-medium text-center">الحالة</th>
                            <th className="px-6 py-4 font-medium text-center">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {coupons.map(coupon => {
                            const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                            const isMaxedOut = coupon.max_uses && coupon.uses_count >= coupon.max_uses;

                            return (
                                <tr key={coupon.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-[#D4AF37] font-semibold text-lg">{coupon.code}</span>
                                            <button onClick={() => copyCode(coupon.code)} className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        {coupon.type === 'percentage' ? `${coupon.value}%` : formatPrice(coupon.value)}
                                        {coupon.min_order ? <p className="text-[10px] text-white/40 mt-1">الحد الأدنى: {formatPrice(coupon.min_order)}</p> : null}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center bg-white/5 px-3 py-1 rounded-full text-xs text-[#EBE5D9]/70">
                                            {coupon.uses_count} {coupon.max_uses ? `/ ${coupon.max_uses}` : ''}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('ar-SA') : 'لا يوجد'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {isExpired ? (
                                            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-gray-500/20 text-gray-400">منتهي الصلاحية</span>
                                        ) : isMaxedOut ? (
                                            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400">تجاوز الحد</span>
                                        ) : coupon.is_active ? (
                                            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">مفعل</span>
                                        ) : (
                                            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400">معطل</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-4">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={coupon.is_active} onChange={() => handleToggle(coupon.id, coupon.is_active)} />
                                                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                                            </label>

                                            <button onClick={() => handleDelete(coupon.id)} className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {coupons.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-white/30">
                                    لم يتم إضافة أي كوبونات بعد.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AddCouponModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={() => {
                    setShowModal(false);
                    fetchData();
                }}
            />
        </div>
    );
}
