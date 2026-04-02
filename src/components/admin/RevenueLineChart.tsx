'use client';

import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    ReferenceLine, ResponsiveContainer,
} from 'recharts';
import type { DailyRevenuePoint } from '@/hooks/useAnalyticsData';
import { useCurrency } from '@/context/CurrencyContext';

// ── Tooltip ───────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
    const { formatPrice } = useCurrency();
    if (!active || !payload?.length) return null;
    const date = new Date(label);
    const dateLabel = isNaN(date.getTime())
        ? label
        : date.toLocaleDateString('ar-SA', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div
            className="rounded-xl text-xs"
            style={{
                background: '#1a1208',
                border:     '1px solid rgba(201,168,76,0.2)',
                padding:    '8px 12px',
                direction:  'rtl',
                minWidth:   140,
            }}
        >
            <p style={{ color: '#C9A84C', marginBottom: 6, fontWeight: 500 }}>{dateLabel}</p>
            {payload.map((entry: any, i: number) => (
                <p key={i} style={{ color: entry.stroke ?? '#EBE5D9', marginBottom: 2 }}>
                    <span className="tabular-nums font-medium">
                        {formatPrice(Number(entry.value))}
                    </span>
                </p>
            ))}
            {payload[0]?.payload?.orders !== undefined && (
                <p style={{ color: 'rgba(235,229,217,0.4)', marginTop: 4 }}>
                    {payload[0].payload.orders} طلب
                </p>
            )}
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    data: DailyRevenuePoint[];
}

export default function RevenueLineChart({ data }: Props) {
    const { formatPrice } = useCurrency();
    if (!data.length) {
        return (
            <div className="flex items-center justify-center h-64" style={{ color: 'rgba(235,229,217,0.3)' }}>
                لا توجد بيانات للفترة المحددة
            </div>
        );
    }

    const avg = data.reduce((sum, d) => sum + d.revenue, 0) / data.length;

    const tickFormatter = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    // Show fewer ticks for dense datasets
    const tickInterval = data.length > 30 ? Math.ceil(data.length / 10) : 'preserveStartEnd';

    return (
        <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                <XAxis
                    dataKey="date"
                    tick={{ fill: 'rgba(235,229,217,0.35)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={tickFormatter}
                    interval={tickInterval as any}
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
                    cursor={{ stroke: 'rgba(201,168,76,0.15)', strokeWidth: 1 }}
                />
                {/* Average reference line */}
                <ReferenceLine
                    y={avg}
                    stroke="rgba(201,168,76,0.28)"
                    strokeDasharray="5 5"
                    label={{
                        value:    `متوسط ${formatPrice(Math.round(avg))}`,
                        fill:     'rgba(201,168,76,0.5)',
                        fontSize: 9,
                        position: 'insideTopRight',
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#C9A84C"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#C9A84C', strokeWidth: 0 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
