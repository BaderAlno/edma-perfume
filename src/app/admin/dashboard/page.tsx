'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import MetricCard            from '@/components/admin/MetricCard';
import SalesBarChart         from '@/components/admin/SalesBarChart';
import SourceDonutChart      from '@/components/admin/SourceDonutChart';
import OrdersTable           from '@/components/admin/OrdersTable';
import AlertBanner           from '@/components/admin/AlertBanner';

// ── Simple inline spinner ─────────────────────────────────────────────────────
function Spinner() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <svg width={32} height={32} viewBox="0 0 24 24" className="animate-spin" style={{ animationDuration: '0.8s' }}>
                <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="2.5" />
                <path d="M12 2 a10 10 0 0 1 10 10" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function pct(current: number, previous: number): { change: number; direction: 'up' | 'down' | 'neutral' } {
    if (previous === 0) return { change: 0, direction: 'neutral' };
    const change = ((current - previous) / previous) * 100;
    return {
        change,
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    };
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div
            className="rounded-xl p-5"
            style={{
                background: '#120e08',
                border:     '1px solid rgba(212,175,55,0.1)',
            }}
        >
            <h3
                className="text-xs tracking-widest uppercase mb-4"
                style={{ color: 'rgba(212,175,55,0.55)' }}
            >
                {title}
            </h3>
            {children}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { data, loading, error } = useDashboardData();

    if (loading) return <Spinner />;

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-sm" style={{ color: '#ff6b6b' }}>خطأ: {error}</p>
            </div>
        );
    }

    if (!data) return null;

    const revChange   = pct(data.revenueThisMonth, data.revenueLastMonth);
    const ordChange   = pct(data.ordersThisMonth,  data.ordersLastMonth);

    const now  = new Date();
    const month = now.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });

    return (
        <div className="p-6 space-y-6 max-w-[1400px]" dir="rtl">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-light" style={{ color: '#EBE5D9' }}>
                        نظرة عامة
                    </h1>
                    <p className="text-xs mt-1" style={{ color: 'rgba(212,175,55,0.45)' }}>
                        {month}
                    </p>
                </div>
                <a
                    href="/admin/orders"
                    className="text-xs px-4 py-2 rounded-lg transition-colors duration-150"
                    style={{
                        background: 'rgba(212,175,55,0.1)',
                        border:     '1px solid rgba(212,175,55,0.2)',
                        color:      '#D4AF37',
                    }}
                >
                    عرض الطلبات
                </a>
            </div>

            {/* Alert banners */}
            <AlertBanner
                lowStockProducts={data.lowStockProducts}
                pendingCount={data.pendingCount}
            />

            {/* Metrics grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="الإيرادات هذا الشهر"
                    value={data.revenueThisMonth}
                    isCurrency={true}
                    change={revChange.change}
                    changeDirection={revChange.direction}
                />
                <MetricCard
                    label="الطلبات هذا الشهر"
                    value={data.ordersThisMonth}
                    change={ordChange.change}
                    changeDirection={ordChange.direction}
                />
                <MetricCard
                    label="متوسط قيمة الطلب"
                    value={Math.round(data.avgOrderValue)}
                    isCurrency={true}
                />
                <MetricCard
                    label="إجمالي العملاء"
                    value={data.totalCustomers}
                />
            </div>

            {/* Second row: charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <SectionCard title="الإيرادات حسب المنتج — هذا الشهر">
                        <SalesBarChart data={data.revenueByProduct} />
                    </SectionCard>
                </div>
                <div>
                    <SectionCard title="الطلبات حسب المصدر — هذا الشهر">
                        <SourceDonutChart data={data.ordersBySource} />
                    </SectionCard>
                </div>
            </div>

            {/* Third row: recent orders + low stock */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <SectionCard title="آخر الطلبات">
                        <OrdersTable orders={data.recentOrders} />
                    </SectionCard>
                </div>

                <div>
                    <SectionCard title="تنبيهات المخزون">
                        {data.lowStockProducts.length === 0 ? (
                            <p className="text-sm py-4" style={{ color: 'rgba(235,229,217,0.3)' }}>
                                جميع المنتجات بمخزون كافٍ ✓
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {data.lowStockProducts.map(p => (
                                    <li key={p.id} className="flex items-center justify-between text-sm">
                                        <span style={{ color: '#EBE5D9' }}>{p.name}</span>
                                        <span
                                            className="tabular-nums text-xs px-2 py-0.5 rounded-full"
                                            style={{
                                                background: p.stock_status === 'critical'
                                                    ? 'rgba(255,107,107,0.12)'
                                                    : 'rgba(251,191,36,0.12)',
                                                color: p.stock_status === 'critical' ? '#ff6b6b' : '#fbbf24',
                                            }}
                                        >
                                            {p.stock_quantity} قطعة
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </SectionCard>
                </div>
            </div>
        </div>
    );
}
