'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';

import DateRangePicker, {
    computePresetRange,
    computeCustomRange,
    type DatePreset,
} from '@/components/admin/DateRangePicker';
import RevenueLineChart from '@/components/admin/RevenueLineChart';
import ProductBarChart from '@/components/admin/ProductBarChart';
import DayOfWeekChart from '@/components/admin/DayOfWeekChart';
import SourceStackedChart from '@/components/admin/SourceStackedChart';
import TopCitiesChart from '@/components/admin/TopCitiesChart';
import AIInsights from '@/components/admin/AIInsights';
import DataChat from '@/components/admin/DataChat';
import {
    useAnalyticsData,
    type ProductSummaryRow,
    type AnalyticsData,
} from '@/hooks/useAnalyticsData';
import { useCurrency } from '@/context/CurrencyContext';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'unitsSold' | 'revenue' | 'avgPrice' | 'pctOfTotal' | 'growth';
type SortDir = 'asc' | 'desc';

function pctChange(current: number, previous: number) {
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
}

function fmtPct(n: number | null) {
    if (n === null) return '—';
    return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Spinner() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <svg width={32} height={32} viewBox="0 0 24 24" className="animate-spin" style={{ animationDuration: '0.8s' }}>
                <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth="2.5" />
                <path d="M12 2 a10 10 0 0 1 10 10" fill="none" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
        </div>
    );
}

function SectionCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`rounded-xl p-5 ${className} print-card`}
            style={{ background: '#120e08', border: '1px solid rgba(201,168,76,0.1)' }}
        >
            <h3 className="text-xs tracking-widest uppercase mb-4" style={{ color: 'rgba(201,168,76,0.55)' }}>
                {title}
            </h3>
            {children}
        </div>
    );
}

// Metric card with optional comparison value
function StatCard({
    label, value, suffix = '', prev, showComparison,
}: {
    label: string;
    value: number;
    suffix?: string;
    prev?: number;
    showComparison?: boolean;
}) {
    const { formatPrice } = useCurrency();
    const change = prev !== undefined ? pctChange(value, prev) : null;
    const isPositive = change !== null && change > 0;
    const isNegative = change !== null && change < 0;

    return (
        <div
            className="rounded-xl p-4"
            style={{ background: '#120e08', border: '1px solid rgba(201,168,76,0.1)' }}
        >
            <p className="text-xs mb-2 tracking-wide" style={{ color: 'rgba(235,229,217,0.45)' }}>{label}</p>
            <p className="text-2xl font-light tabular-nums" style={{ color: '#EBE5D9' }}>
                {formatPrice(Math.round(value))}
            </p>
            {showComparison && change !== null && (
                <div className="flex items-center gap-1 mt-2">
                    <span
                        className="text-xs tabular-nums font-medium"
                        style={{ color: isPositive ? '#4ade80' : isNegative ? '#f87171' : 'rgba(235,229,217,0.4)' }}
                    >
                        {fmtPct(change)}
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(235,229,217,0.3)' }}>
                        مقارنة بالفترة السابقة
                    </span>
                </div>
            )}
            {showComparison && prev !== undefined && (
                <p className="text-xs mt-1" style={{ color: 'rgba(235,229,217,0.25)' }}>
                    سابق: {formatPrice(Math.round(prev))}
                </p>
            )}
        </div>
    );
}

// Sortable table header cell
function ThSort({
    label, sortKey, activeSortKey, sortDir, onSort,
}: {
    label: string;
    sortKey: SortKey;
    activeSortKey: SortKey;
    sortDir: SortDir;
    onSort: (k: SortKey) => void;
}) {
    const isActive = activeSortKey === sortKey;
    return (
        <th
            className="text-right py-2 px-3 text-xs tracking-wide cursor-pointer select-none whitespace-nowrap"
            style={{ color: isActive ? '#C9A84C' : 'rgba(235,229,217,0.4)' }}
            onClick={() => onSort(sortKey)}
        >
            {label}
            <span className="mr-1 opacity-60">
                {isActive ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ' ↕'}
            </span>
        </th>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export helpers
// ─────────────────────────────────────────────────────────────────────────────

function exportExcel(data: AnalyticsData, periodLabel: string, currencyCode: string) {
    const wb = XLSX.utils.book_new();

    // Daily revenue
    const daily = data.dailyRevenue.map(d => ({
        'التاريخ': d.date,
        [`الإيرادات (${currencyCode})`]: Math.round(d.revenue),
        'عدد الطلبات': d.orders,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(daily), 'الإيرادات اليومية');

    // Product summary
    const prods = data.productSummary.map(p => ({
        'المنتج': p.name,
        'الوحدات المباعة': p.unitsSold,
        [`الإيرادات (${currencyCode})`]: Math.round(p.revenue),
        [`متوسط السعر (${currencyCode})`]: Math.round(p.avgPrice),
        'نسبة الإيرادات %': p.pctOfTotal.toFixed(1),
        'النمو %': p.isNew ? 'جديد' : p.growth.toFixed(1),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prods), 'ملخص المنتجات');

    // Top customers
    const cust = data.topCustomers.map(c => ({
        'الترتيب': c.rank,
        'العميل': c.name,
        [`الإنفاق (${currencyCode})`]: Math.round(c.spent),
        'عدد الطلبات': c.orders,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cust), 'أفضل العملاء');

    // Cities
    const cities = data.cityRevenue.map(c => ({
        'المدينة': c.city,
        [`الإيرادات (${currencyCode})`]: Math.round(c.revenue),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cities), 'الإيرادات حسب المدينة');

    XLSX.writeFile(wb, `edma-analytics-${periodLabel}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Product summary table
// ─────────────────────────────────────────────────────────────────────────────

function ProductSummaryTable({
    rows, showComparison,
}: {
    rows: ProductSummaryRow[];
    showComparison: boolean;
}) {
    const { formatPrice } = useCurrency();
    const [sortKey, setSortKey] = useState<SortKey>('revenue');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    function handleSort(k: SortKey) {
        if (k === sortKey) {
            setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        } else {
            setSortKey(k);
            setSortDir('desc');
        }
    }

    const sorted = useMemo(() => {
        const copy = [...rows];
        copy.sort((a, b) => {
            const va = a[sortKey as keyof ProductSummaryRow] as number | string;
            const vb = b[sortKey as keyof ProductSummaryRow] as number | string;
            if (typeof va === 'string') return sortDir === 'asc'
                ? va.localeCompare(vb as string)
                : (vb as string).localeCompare(va);
            return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
        });
        return copy;
    }, [rows, sortKey, sortDir]);

    const totals = useMemo(() => ({
        unitsSold: rows.reduce((s, r) => s + r.unitsSold, 0),
        revenue: rows.reduce((s, r) => s + r.revenue, 0),
    }), [rows]);

    const thProps = { activeSortKey: sortKey, sortDir, onSort: handleSort };

    if (!rows.length) {
        return (
            <p className="text-sm py-6 text-center" style={{ color: 'rgba(235,229,217,0.3)' }}>
                لا توجد بيانات
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
                <thead>
                    <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                        <ThSort label="المنتج" sortKey="name"       {...thProps} />
                        <ThSort label="الوحدات المباعة" sortKey="unitsSold"  {...thProps} />
                        <ThSort label="الإيرادات" sortKey="revenue"    {...thProps} />
                        <ThSort label="متوسط السعر" sortKey="avgPrice"   {...thProps} />
                        <ThSort label="نسبة الإيرادات" sortKey="pctOfTotal" {...thProps} />
                        {showComparison && (
                            <ThSort label="النمو" sortKey="growth"     {...thProps} />
                        )}
                    </tr>
                </thead>
                <tbody>
                    {sorted.map(row => {
                        const growthColor = row.isNew
                            ? '#C9A84C'
                            : row.growth > 0 ? '#4ade80'
                                : row.growth < 0 ? '#f87171'
                                    : 'rgba(235,229,217,0.4)';

                        return (
                            <tr
                                key={row.productId}
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                            >
                                <td className="py-3 px-3" style={{ color: '#EBE5D9' }}>{row.name}</td>
                                <td className="py-3 px-3 tabular-nums text-left" style={{ color: 'rgba(235,229,217,0.75)' }}>
                                    {row.unitsSold.toLocaleString('ar-SA')}
                                </td>
                                <td className="py-3 px-3 tabular-nums text-left" style={{ color: '#C9A84C' }}>
                                    {formatPrice(row.revenue)}
                                </td>
                                <td className="py-3 px-3 tabular-nums text-left" style={{ color: 'rgba(235,229,217,0.65)' }}>
                                    {formatPrice(Math.round(row.avgPrice))}
                                </td>
                                <td className="py-3 px-3 text-left">
                                    {/* % bar */}
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-1 rounded-full flex-shrink-0"
                                            style={{
                                                width: 60,
                                                background: 'rgba(201,168,76,0.12)',
                                            }}
                                        >
                                            <div
                                                className="h-1 rounded-full"
                                                style={{
                                                    width: `${Math.min(row.pctOfTotal, 100)}%`,
                                                    background: '#C9A84C',
                                                }}
                                            />
                                        </div>
                                        <span className="tabular-nums text-xs" style={{ color: 'rgba(235,229,217,0.6)' }}>
                                            {row.pctOfTotal.toFixed(1)}%
                                        </span>
                                    </div>
                                </td>
                                {showComparison && (
                                    <td className="py-3 px-3 tabular-nums text-xs text-left" style={{ color: growthColor }}>
                                        {row.isNew ? 'جديد' : fmtPct(row.growth)}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
                {/* Totals row */}
                <tfoot>
                    <tr style={{ borderTop: '1px solid rgba(201,168,76,0.2)' }}>
                        <td className="py-3 px-3 text-xs font-medium" style={{ color: 'rgba(201,168,76,0.7)' }}>
                            الإجمالي
                        </td>
                        <td className="py-3 px-3 tabular-nums text-left text-xs" style={{ color: 'rgba(235,229,217,0.7)' }}>
                            {totals.unitsSold.toLocaleString('ar-SA')}
                        </td>
                        <td className="py-3 px-3 tabular-nums text-left text-xs" style={{ color: '#C9A84C' }}>
                            {formatPrice(totals.revenue)}
                        </td>
                        <td colSpan={showComparison ? 3 : 2} />
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main dashboard
// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
    const { currency, formatPrice } = useCurrency();
    const searchParams = useSearchParams();
    const [compareMode, setCompareMode] = useState(false);

    // ── Resolve date range from URL params ─────────────────────────────────
    const preset = (searchParams.get('preset') as DatePreset | null) ?? '30d';
    const fromStr = searchParams.get('from') ?? '';
    const toStr = searchParams.get('to') ?? '';
    const isCustom = Boolean(fromStr && toStr);

    const range = useMemo(() => {
        if (isCustom) return computeCustomRange(fromStr, toStr);
        return computePresetRange(preset);
    }, [isCustom, fromStr, toStr, preset]);

    // Values for the custom date inputs (YYYY-MM-DD)
    const fromValue = isCustom ? fromStr : range.start.toISOString().slice(0, 10);
    const toValue = isCustom ? toStr : range.end.toISOString().slice(0, 10);

    const { data, loading, error } = useAnalyticsData({
        startDate: range.start,
        endDate: range.end,
        prevStartDate: range.prevStart,
        prevEndDate: range.prevEnd,
    });

    // ── Period label (for export filename) ────────────────────────────────
    const periodLabel = isCustom ? `${fromStr}_${toStr}` : preset;

    // ── Render states ─────────────────────────────────────────────────────
    if (loading) return <Spinner />;

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-sm" style={{ color: '#f87171' }}>خطأ في تحميل البيانات: {error}</p>
            </div>
        );
    }

    if (!data) return null;

    const { current, previous } = data;

    return (
        <>
            {/* ── Print-only CSS ───────────────────────────────────────── */}
            <style>{`
                @media print {
                    body { background: #fff !important; color: #111 !important; }
                    aside, nav, .no-print { display: none !important; }
                    .print-card {
                        background: #fff !important;
                        border: 1px solid #ddd !important;
                        break-inside: avoid;
                        margin-bottom: 16px;
                    }
                    .analytics-header { margin-bottom: 24px; }
                }
            `}</style>

            <div className="p-6 space-y-6 max-w-[1400px]" dir="rtl">

                {/* ── Header ───────────────────────────────────────────── */}
                <div className="analytics-header flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-light" style={{ color: '#EBE5D9' }}>
                            تحليلات المبيعات
                        </h1>
                        <p className="text-xs mt-1" style={{ color: 'rgba(201,168,76,0.45)' }}>
                            {range.start.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                            {' — '}
                            {range.end.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap no-print">
                        {/* Compare toggle */}
                        <button
                            onClick={() => setCompareMode(m => !m)}
                            className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
                            style={{
                                background: compareMode ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${compareMode ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.1)'}`,
                                color: compareMode ? '#C9A84C' : 'rgba(235,229,217,0.55)',
                            }}
                        >
                            {compareMode ? '✓ ' : ''}مقارنة الفترات
                        </button>

                        {/* Export Excel */}
                        <button
                            onClick={() => exportExcel(data, periodLabel, currency)}
                            className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: 'rgba(235,229,217,0.65)',
                            }}
                        >
                            تصدير Excel
                        </button>

                        {/* Export PDF */}
                        <button
                            onClick={() => window.print()}
                            className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
                            style={{
                                background: 'rgba(201,168,76,0.1)',
                                border: '1px solid rgba(201,168,76,0.2)',
                                color: '#C9A84C',
                            }}
                        >
                            تصدير PDF
                        </button>
                    </div>
                </div>

                {/* ── Date range picker ─────────────────────────────────── */}
                <div className="no-print">
                    <DateRangePicker
                        activePreset={isCustom ? null : preset}
                        fromValue={fromValue}
                        toValue={toValue}
                    />
                </div>

                {/* ── Summary metric cards ──────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="إجمالي الإيرادات"
                        value={current.totalRevenue}
                        prev={previous.totalRevenue}
                        showComparison={compareMode}
                    />
                    <StatCard
                        label="إجمالي الطلبات"
                        value={current.totalOrders}
                        prev={previous.totalOrders}
                        showComparison={compareMode}
                    />
                    <StatCard
                        label="متوسط قيمة الطلب"
                        value={current.avgOrderValue}
                        prev={previous.avgOrderValue}
                        showComparison={compareMode}
                    />
                    <StatCard
                        label="عملاء فريدون"
                        value={current.uniqueCustomers}
                        prev={previous.uniqueCustomers}
                        showComparison={compareMode}
                    />
                </div>

                {/* ── Conversion quick stats ────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div
                        className="rounded-xl p-4"
                        style={{ background: '#120e08', border: '1px solid rgba(201,168,76,0.1)' }}
                    >
                        <p className="text-xs mb-1" style={{ color: 'rgba(235,229,217,0.4)' }}>طلبات مسلّمة</p>
                        <p className="text-xl font-light tabular-nums" style={{ color: '#4ade80' }}>
                            {data.deliveredOrders}
                        </p>
                        {current.totalOrders > 0 && (
                            <p className="text-xs mt-1" style={{ color: 'rgba(235,229,217,0.3)' }}>
                                {((data.deliveredOrders / current.totalOrders) * 100).toFixed(0)}% من إجمالي الطلبات
                            </p>
                        )}
                    </div>
                    <div
                        className="rounded-xl p-4"
                        style={{ background: '#120e08', border: '1px solid rgba(201,168,76,0.1)' }}
                    >
                        <p className="text-xs mb-1" style={{ color: 'rgba(235,229,217,0.4)' }}>طلبات ملغاة</p>
                        <p className="text-xl font-light tabular-nums" style={{ color: '#f87171' }}>
                            {data.cancelledOrders}
                        </p>
                        {(current.totalOrders + data.cancelledOrders) > 0 && (
                            <p className="text-xs mt-1" style={{ color: 'rgba(235,229,217,0.3)' }}>
                                {((data.cancelledOrders / (current.totalOrders + data.cancelledOrders)) * 100).toFixed(0)}% معدل الإلغاء
                            </p>
                        )}
                    </div>
                    <div
                        className="rounded-xl p-4"
                        style={{ background: '#120e08', border: '1px solid rgba(201,168,76,0.1)' }}
                    >
                        <p className="text-xs mb-1" style={{ color: 'rgba(235,229,217,0.4)' }}>مدن شحن مختلفة</p>
                        <p className="text-xl font-light tabular-nums" style={{ color: '#EBE5D9' }}>
                            {data.cityRevenue.length}
                        </p>
                    </div>
                </div>

                {/* ── Revenue line chart ────────────────────────────────── */}
                <SectionCard title="الإيرادات اليومية">
                    <RevenueLineChart data={data.dailyRevenue} />
                </SectionCard>

                {/* ── Product × month + Day of week ────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                        <SectionCard title="الإيرادات حسب المنتج والشهر">
                            <ProductBarChart
                                data={data.productMonthRevenue}
                                productNames={data.productNames}
                            />
                        </SectionCard>
                    </div>
                    <div>
                        <SectionCard title="الطلبات حسب يوم الأسبوع">
                            <DayOfWeekChart data={data.dayOfWeekData} />
                        </SectionCard>
                    </div>
                </div>

                {/* ── Source stacked + Top cities ───────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SectionCard title="مصادر الطلبات الأسبوعية">
                        <SourceStackedChart data={data.weeklySourceData} />
                    </SectionCard>
                    <SectionCard title="أفضل 5 مدن بالإيرادات">
                        <TopCitiesChart data={data.cityRevenue} />
                    </SectionCard>
                </div>

                {/* ── AI Insights & Data Chat ──────────────────────────── */}
                <div className="no-print">
                    <AIInsights />
                    <DataChat />
                </div>

                {/* ── Product summary table ─────────────────────────────── */}
                <SectionCard title="ملخص أداء المنتجات">
                    <ProductSummaryTable rows={data.productSummary} showComparison={compareMode} />
                </SectionCard>

                {/* ── Top 10 customers ─────────────────────────────────── */}
                <SectionCard title="أفضل 10 عملاء بالإنفاق">
                    {data.topCustomers.length === 0 ? (
                        <p className="text-sm py-4 text-center" style={{ color: 'rgba(235,229,217,0.3)' }}>
                            لا توجد بيانات
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm" dir="rtl">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                                        {['الترتيب', 'العميل', 'إجمالي الإنفاق', 'عدد الطلبات'].map(h => (
                                            <th key={h} className="text-right py-2 px-3 text-xs tracking-wide"
                                                style={{ color: 'rgba(235,229,217,0.4)' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.topCustomers.map(c => (
                                        <tr key={c.rank}
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td className="py-3 px-3">
                                                <span
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                                    style={{
                                                        display: 'inline-flex',
                                                        background: c.rank <= 3 ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)',
                                                        color: c.rank <= 3 ? '#C9A84C' : 'rgba(235,229,217,0.4)',
                                                    }}
                                                >
                                                    {c.rank}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3" style={{ color: '#EBE5D9' }}>{c.name}</td>
                                            <td className="py-3 px-3 tabular-nums" style={{ color: '#C9A84C' }}>
                                                {formatPrice(c.spent)}
                                            </td>
                                            <td className="py-3 px-3 tabular-nums" style={{ color: 'rgba(235,229,217,0.6)' }}>
                                                {c.orders}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>

            </div>
        </>
    );
}
