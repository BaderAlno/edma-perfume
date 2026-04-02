'use client';

import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    Cell, ResponsiveContainer,
} from 'recharts';
import type { CityRevenuePoint } from '@/hooks/useAnalyticsData';
import { useCurrency } from '@/context/CurrencyContext';

// ── Tooltip ───────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
    const { formatPrice } = useCurrency();
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as CityRevenuePoint;
    return (
        <div
            className="rounded-xl text-xs"
            style={{
                background: '#1a1208',
                border:     '1px solid rgba(201,168,76,0.2)',
                padding:    '8px 12px',
                direction:  'rtl',
            }}
        >
            <p style={{ color: '#C9A84C', fontWeight: 500 }}>{d.city}</p>
            <p style={{ color: '#EBE5D9', marginTop: 4 }}>
                <span className="tabular-nums font-medium">{formatPrice(d.revenue)}</span>
            </p>
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    data: CityRevenuePoint[];
}

export default function TopCitiesChart({ data }: Props) {
    if (!data.length) {
        return (
            <div className="flex items-center justify-center h-56" style={{ color: 'rgba(235,229,217,0.3)' }}>
                لا توجد بيانات للفترة المحددة
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 48)}>
            <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
                <XAxis
                    type="number"
                    tick={{ fill: 'rgba(235,229,217,0.35)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <YAxis
                    type="category"
                    dataKey="city"
                    tick={{ fill: 'rgba(235,229,217,0.7)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                />
                <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(201,168,76,0.04)' }}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={30}>
                    {data.map((_, i) => (
                        <Cell
                            key={`cell-${i}`}
                            fill={`rgba(201,168,76,${Math.max(0.9 - i * 0.14, 0.3)})`}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
