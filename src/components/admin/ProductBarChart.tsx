'use client';

import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    Legend, ResponsiveContainer,
} from 'recharts';
import type { ProductMonthPoint } from '@/hooks/useAnalyticsData';
import { useCurrency } from '@/context/CurrencyContext';

const GOLD_SHADES = ['#C9A84C', '#E8C76B', '#A8843C', '#F0D88A', '#8A6B2C', '#D4B665', '#B89040'];

// ── Tooltip ───────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
    const { formatPrice } = useCurrency();
    if (!active || !payload?.length) return null;
    return (
        <div
            className="rounded-xl text-xs"
            style={{
                background: '#1a1208',
                border:     '1px solid rgba(201,168,76,0.2)',
                padding:    '8px 12px',
                direction:  'rtl',
                minWidth:   160,
            }}
        >
            <p style={{ color: '#C9A84C', marginBottom: 6, fontWeight: 500 }}>{label}</p>
            {payload.map((entry: any, i: number) => (
                <p key={i} style={{ color: entry.fill, marginBottom: 2 }}>
                    {entry.name}:{' '}
                    <span className="tabular-nums font-medium">
                        {formatPrice(Number(entry.value))}
                    </span>
                </p>
            ))}
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    data:         ProductMonthPoint[];
    productNames: string[];
}

export default function ProductBarChart({ data, productNames }: Props) {
    if (!data.length || !productNames.length) {
        return (
            <div className="flex items-center justify-center h-64" style={{ color: 'rgba(235,229,217,0.3)' }}>
                لا توجد بيانات للفترة المحددة
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={260}>
            <BarChart
                data={data}
                margin={{ top: 12, right: 10, left: 0, bottom: 8 }}
                barGap={2}
                barCategoryGap="28%"
            >
                <XAxis
                    dataKey="monthLabel"
                    tick={{ fill: 'rgba(235,229,217,0.45)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fill: 'rgba(235,229,217,0.35)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                    width={38}
                />
                <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(201,168,76,0.04)' }}
                />
                <Legend
                    wrapperStyle={{ color: 'rgba(235,229,217,0.55)', fontSize: 11, paddingTop: 8 }}
                />
                {productNames.map((name, i) => (
                    <Bar
                        key={name}
                        dataKey={name}
                        fill={GOLD_SHADES[i % GOLD_SHADES.length]}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={36}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}
