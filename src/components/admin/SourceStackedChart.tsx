'use client';

import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    Legend, ResponsiveContainer,
} from 'recharts';
import type { WeeklySourcePoint } from '@/hooks/useAnalyticsData';

const SOURCE_COLORS: Record<string, string> = {
    website:   '#C9A84C',
    whatsapp:  '#25D366',
    instagram: '#E1306C',
};

const SOURCE_LABELS: Record<string, string> = {
    website:   'الموقع',
    whatsapp:  'واتساب',
    instagram: 'إنستغرام',
};

// ── Tooltip ───────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
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
            <p style={{ color: '#C9A84C', marginBottom: 6, fontWeight: 500 }}>{label}</p>
            {payload.map((entry: any, i: number) => (
                <p key={i} style={{ color: SOURCE_COLORS[entry.dataKey] ?? '#EBE5D9', marginBottom: 2 }}>
                    {SOURCE_LABELS[entry.dataKey] ?? entry.dataKey}:{' '}
                    <span className="tabular-nums font-medium">{entry.value}</span> طلب
                </p>
            ))}
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    data: WeeklySourcePoint[];
}

export default function SourceStackedChart({ data }: Props) {
    if (!data.length) {
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
                    dataKey="weekLabel"
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
                <Legend
                    wrapperStyle={{ color: 'rgba(235,229,217,0.55)', fontSize: 11, paddingTop: 8 }}
                    formatter={value => SOURCE_LABELS[value] ?? value}
                />
                <Bar dataKey="website"   stackId="src" fill={SOURCE_COLORS.website}   maxBarSize={44} />
                <Bar dataKey="whatsapp"  stackId="src" fill={SOURCE_COLORS.whatsapp}  maxBarSize={44} />
                <Bar
                    dataKey="instagram"
                    stackId="src"
                    fill={SOURCE_COLORS.instagram}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={44}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
