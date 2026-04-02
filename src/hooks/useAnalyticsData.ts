'use client';

import { useMemo } from 'react';

// ── Public types ──────────────────────────────────────────────────────────────

export interface DailyRevenuePoint {
    date: string;     // YYYY-MM-DD
    revenue: number;
    orders: number;
}

export interface ProductMonthPoint {
    monthLabel: string;  // e.g. "مارس 2025"
    monthKey:   string;  // YYYY-MM for sorting
    [product: string]: number | string;
}

export interface DayOfWeekPoint {
    day:      string;   // Arabic day name
    dayIndex: number;   // 0 (Sun) – 6 (Sat)
    orders:   number;
    isTop:    boolean;
}

export interface WeeklySourcePoint {
    weekLabel: string;
    website:   number;
    whatsapp:  number;
    instagram: number;
}

export interface TopCustomer {
    rank:   number;
    name:   string;
    spent:  number;
    orders: number;
}

export interface CityRevenuePoint {
    city:    string;
    revenue: number;
}

export interface ProductSummaryRow {
    productId:   string;
    name:        string;
    unitsSold:   number;
    revenue:     number;
    avgPrice:    number;
    pctOfTotal:  number;
    growth:      number;   // % vs previous period
    isNew:       boolean;
}

export interface PeriodMetrics {
    totalRevenue:     number;
    totalOrders:      number;
    avgOrderValue:    number;
    uniqueCustomers:  number;
}

export interface AnalyticsData {
    dailyRevenue:        DailyRevenuePoint[];
    productMonthRevenue: ProductMonthPoint[];
    dayOfWeekData:       DayOfWeekPoint[];
    weeklySourceData:    WeeklySourcePoint[];
    topCustomers:        TopCustomer[];
    cityRevenue:         CityRevenuePoint[];
    productSummary:      ProductSummaryRow[];
    current:             PeriodMetrics;
    previous:            PeriodMetrics;
    productNames:        string[];
    deliveredOrders:     number;
    cancelledOrders:     number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PRODUCT_NAMES = ['عود الملوك', 'مسك الليل', 'ورد الطائف'];
const PRODUCT_IDS   = ['prod-1',     'prod-2',     'prod-3'];
const PRODUCT_PRICES = [380, 290, 320];

const DAY_NAMES_AR = [
    'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء',
    'الخميس', 'الجمعة', 'السبت',
];

const MONTH_NAMES_AR = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const CUSTOMER_NAMES = [
    'محمد العمري', 'سارة الحربي', 'خالد الشمري', 'نورة القحطاني',
    'عبدالله الدوسري', 'ريم السلمي', 'فيصل المطيري', 'هند الغامدي',
    'تركي الزهراني', 'منى العتيبي',
];

const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة'];

// ── Deterministic pseudo-random seeded by day index ──────────────────────────

function seededRand(seed: number): number {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
}

// ── Mock data generator ───────────────────────────────────────────────────────

function buildMockData(startDate: Date, endDate: Date): AnalyticsData {
    const msPerDay = 86_400_000;
    const dayCount = Math.max(
        1,
        Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1,
    );

    // ── Daily revenue ─────────────────────────────────────────────────────────
    const dailyRevenue: DailyRevenuePoint[] = [];
    const dayOfWeekAccum = new Array(7).fill(0);

    for (let i = 0; i < dayCount; i++) {
        const d = new Date(startDate.getTime() + i * msPerDay);
        const dateStr = d.toISOString().slice(0, 10);
        const dow = d.getDay();

        // Weekend (Thu/Fri in SA) gets a bump
        const weekendBoost = dow === 4 || dow === 5 ? 1.4 : 1.0;
        const rand = seededRand(i * 7 + d.getMonth() * 31);
        const orders = Math.round((3 + rand * 7) * weekendBoost);
        const revenue = orders * (280 + Math.round(seededRand(i * 13) * 150));

        dailyRevenue.push({ date: dateStr, revenue, orders });
        dayOfWeekAccum[dow] += orders;
    }

    // ── Day of week ───────────────────────────────────────────────────────────
    const maxDayOrders = Math.max(...dayOfWeekAccum);
    const dayOfWeekData: DayOfWeekPoint[] = DAY_NAMES_AR.map((day, idx) => ({
        day,
        dayIndex: idx,
        orders:   dayOfWeekAccum[idx],
        isTop:    dayOfWeekAccum[idx] === maxDayOrders,
    }));

    // ── Product × month revenue ───────────────────────────────────────────────
    const monthSet = new Set<string>();
    for (const pt of dailyRevenue) monthSet.add(pt.date.slice(0, 7));
    const sortedMonths = [...monthSet].sort();

    const productMonthRevenue: ProductMonthPoint[] = sortedMonths.map((mk, mi) => {
        const [year, month] = mk.split('-');
        const label = `${MONTH_NAMES_AR[parseInt(month, 10) - 1]} ${year}`;
        const point: ProductMonthPoint = { monthLabel: label, monthKey: mk };
        PRODUCT_NAMES.forEach((name, pi) => {
            const base = 12_000 + pi * 3_000;
            point[name] = Math.round(base * (0.8 + seededRand(mi * 5 + pi) * 0.6));
        });
        return point;
    });

    // ── Weekly source breakdown ───────────────────────────────────────────────
    const weekCount = Math.max(1, Math.ceil(dayCount / 7));
    const weeklySourceData: WeeklySourcePoint[] = Array.from({ length: weekCount }, (_, wi) => ({
        weekLabel: `أسبوع ${wi + 1}`,
        website:   Math.round(8  + seededRand(wi * 3 + 1) * 12),
        whatsapp:  Math.round(5  + seededRand(wi * 3 + 2) * 10),
        instagram: Math.round(3  + seededRand(wi * 3 + 3) * 8),
    }));

    // ── Top customers ─────────────────────────────────────────────────────────
    const topCustomers: TopCustomer[] = CUSTOMER_NAMES.map((name, i) => ({
        rank:   i + 1,
        name,
        spent:  Math.round(2_400 - i * 180 + seededRand(i * 7) * 300),
        orders: Math.round(7 - i * 0.5 + seededRand(i * 3)),
    })).sort((a, b) => b.spent - a.spent).map((c, i) => ({ ...c, rank: i + 1 }));

    // ── City revenue ──────────────────────────────────────────────────────────
    const totalRevenue = dailyRevenue.reduce((s, d) => s + d.revenue, 0);
    const cityShares   = [0.38, 0.27, 0.16, 0.11, 0.08];
    const cityRevenue: CityRevenuePoint[] = CITIES.map((city, i) => ({
        city,
        revenue: Math.round(totalRevenue * cityShares[i]),
    }));

    // ── Product summary ───────────────────────────────────────────────────────
    const productSummary: ProductSummaryRow[] = PRODUCT_NAMES.map((name, i) => {
        const revenue    = Math.round(totalRevenue * (0.42 - i * 0.08));
        const unitsSold  = Math.round(revenue / PRODUCT_PRICES[i]);
        const avgPrice   = PRODUCT_PRICES[i];
        const pctOfTotal = (revenue / totalRevenue) * 100;
        const growth     = -8 + seededRand(i * 11) * 40; // -8% to +32%
        return { productId: PRODUCT_IDS[i], name, unitsSold, revenue, avgPrice, pctOfTotal, growth, isNew: false };
    });

    // ── Period metrics ────────────────────────────────────────────────────────
    const totalOrders    = dailyRevenue.reduce((s, d) => s + d.orders, 0);
    const avgOrderValue  = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const deliveredOrders = Math.round(totalOrders * 0.82);
    const cancelledOrders = Math.round(totalOrders * 0.07);

    const current: PeriodMetrics = {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        uniqueCustomers: Math.round(totalOrders * 0.74),
    };
    const previous: PeriodMetrics = {
        totalRevenue:    Math.round(totalRevenue * 0.88),
        totalOrders:     Math.round(totalOrders  * 0.85),
        avgOrderValue:   Math.round(avgOrderValue * 0.96),
        uniqueCustomers: Math.round(current.uniqueCustomers * 0.80),
    };

    return {
        dailyRevenue,
        productMonthRevenue,
        dayOfWeekData,
        weeklySourceData,
        topCustomers,
        cityRevenue,
        productSummary,
        current,
        previous,
        productNames:    PRODUCT_NAMES,
        deliveredOrders,
        cancelledOrders,
    };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface Params {
    startDate:     Date;
    endDate:       Date;
    prevStartDate: Date;
    prevEndDate:   Date;
}

export function useAnalyticsData(params: Params) {
    const { startDate, endDate } = params;

    const data = useMemo(
        () => buildMockData(startDate, endDate),
        // Recompute only when the date boundaries change
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [startDate.toISOString(), endDate.toISOString()],
    );

    return { data, loading: false, error: null };
}
