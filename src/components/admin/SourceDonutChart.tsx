'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
    data: { name: string; value: number; color: string }[];
}

const SOURCE_LABELS: Record<string, string> = {
    website:   'الموقع',
    whatsapp:  'واتساب',
    instagram: 'انستغرام',
};

function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
        <div
            className="rounded-lg px-3 py-2 text-xs"
            style={{
                background: '#1a1208',
                border:     '1px solid rgba(212,175,55,0.2)',
                color:      '#EBE5D9',
            }}
        >
            <p style={{ color: d.payload.color }} className="mb-1 font-medium">
                {SOURCE_LABELS[d.name] ?? d.name}
            </p>
            <p>
                <span className="tabular-nums font-medium">{d.value}</span>
                <span style={{ color: 'rgba(235,229,217,0.5)' }}> طلب</span>
            </p>
        </div>
    );
}

function CustomLegend({ payload }: any) {
    return (
        <ul className="flex flex-col gap-2 mt-2">
            {(payload ?? []).map((entry: any) => (
                <li key={entry.value} className="flex items-center gap-2 text-xs">
                    <span
                        className="inline-block rounded-full flex-shrink-0"
                        style={{ width: 8, height: 8, background: entry.color }}
                    />
                    <span style={{ color: 'rgba(235,229,217,0.6)' }}>
                        {SOURCE_LABELS[entry.value] ?? entry.value}
                    </span>
                    <span className="tabular-nums ml-auto" style={{ color: '#EBE5D9' }}>
                        {entry.payload.value}
                    </span>
                </li>
            ))}
        </ul>
    );
}

export default function SourceDonutChart({ data }: Props) {
    if (!data.length) {
        return (
            <div className="flex items-center justify-center h-48" style={{ color: 'rgba(235,229,217,0.3)' }}>
                لا توجد بيانات هذا الشهر
            </div>
        );
    }

    return (
        <div className="flex items-center gap-6">
            <div style={{ flex: '0 0 140px', height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={38}
                            outerRadius={60}
                            paddingAngle={3}
                            strokeWidth={0}
                        >
                            {data.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex-1">
                <CustomLegend payload={data.map(d => ({ value: d.name, color: d.color, payload: d }))} />
            </div>
        </div>
    );
}
