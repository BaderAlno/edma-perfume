'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import { useCurrency } from '@/context/CurrencyContext';

interface Props {
    data: { name: string; revenue: number }[];
}

function CustomTooltip({ active, payload, label }: any) {
    const { formatPrice } = useCurrency();
    if (!active || !payload?.length) return null;
    return (
        <div
            className="rounded-lg px-3 py-2 text-xs"
            style={{
                background: '#1a1208',
                border:     '1px solid rgba(212,175,55,0.2)',
                color:      '#EBE5D9',
            }}
        >
            <p style={{ color: 'rgba(212,175,55,0.7)' }} className="mb-1">{label}</p>
            <p>
                <span style={{ color: '#D4AF37' }} className="font-medium tabular-nums">
                    {formatPrice(Number(payload[0].value))}
                </span>
            </p>
        </div>
    );
}

export default function SalesBarChart({ data }: Props) {
    if (!data.length) {
        return (
            <div className="flex items-center justify-center h-48" style={{ color: 'rgba(235,229,217,0.3)' }}>
                لا توجد بيانات هذا الشهر
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(212,175,55,0.07)"
                    vertical={false}
                />
                <XAxis
                    dataKey="name"
                    tick={{ fill: 'rgba(235,229,217,0.45)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fill: 'rgba(235,229,217,0.35)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                    width={36}
                />
                <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(212,175,55,0.04)' }}
                />
                <Bar
                    dataKey="revenue"
                    fill="#D4AF37"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
