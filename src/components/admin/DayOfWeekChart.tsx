'use client';

import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    Cell, ResponsiveContainer,
} from 'recharts';
import type { DayOfWeekPoint } from '@/hooks/useAnalyticsData';

// ── Tooltip ───────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as DayOfWeekPoint;
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
            <p style={{ color: d.isTop ? '#C9A84C' : '#EBE5D9', fontWeight: 500 }}>{d.day}</p>
            <p style={{ color: 'rgba(235,229,217,0.7)', marginTop: 4 }}>
                <span className="tabular-nums">{d.orders}</span> طلب
            </p>
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    data: DayOfWeekPoint[];
}

export default function DayOfWeekChart({ data }: Props) {
    const totalOrders = data.reduce((s, d) => s + d.orders, 0);

    if (totalOrders === 0) {
        return (
            <div className="flex items-center justify-center h-56" style={{ color: 'rgba(235,229,217,0.3)' }}>
                لا توجد بيانات للفترة المحددة
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis
                    dataKey="day"
                    tick={{ fill: 'rgba(235,229,217,0.45)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fill: 'rgba(235,229,217,0.35)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={28}
                />
                <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(201,168,76,0.04)' }}
                />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]} maxBarSize={44}>
                    {data.map((entry, i) => (
                        <Cell
                            key={`cell-${i}`}
                            fill={entry.isTop ? '#C9A84C' : 'rgba(201,168,76,0.22)'}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
