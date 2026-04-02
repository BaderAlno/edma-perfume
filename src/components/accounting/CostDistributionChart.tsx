"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useCurrency } from "@/context/CurrencyContext";

interface CostDistributionChartProps {
    rawTotal: number;
    opsPerUnit: number;
    shippingTotal: number;
}

export default function CostDistributionChart({
    rawTotal,
    opsPerUnit,
    shippingTotal
}: CostDistributionChartProps) {
    const { formatPrice } = useCurrency();

    // Data for the Donut Chart
    const data = [
        { name: "المواد الخام", value: rawTotal, color: "#C9A84C" },
        { name: "التشغيل", value: opsPerUnit, color: "#8A6F30" },
        { name: "الشحن", value: shippingTotal, color: "#D45A4A" },
    ].filter(d => d.value > 0);

    const total = rawTotal + opsPerUnit + shippingTotal;

    return (
        <div className="w-full h-[220px] relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        animationDuration={1000}
                    >
                        {data.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.color} 
                                stroke="rgba(0,0,0,0.5)"
                                strokeWidth={2}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip formatPrice={formatPrice} />} />
                </PieChart>
            </ResponsiveContainer>

            {/* Total Indicator in Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-[#f5e9c8]/30 font-mono tracking-widest uppercase">Total Unit Cost</span>
                <span className="text-lg font-bold text-[#f5e9c8] font-mono">
                    {formatPrice(total * 12.2)}
                </span>
            </div>

            {/* Custom Legend */}
            <div className="flex justify-center gap-4 mt-2">
                {data.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] text-[#f5e9c8]/50">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CustomTooltip({ active, payload, formatPrice }: any) {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        return (
            <div className="bg-[#1a1505] border border-[#c9a84c]/30 p-3 rounded-lg shadow-2xl backdrop-blur-md">
                <p className="text-[#f5e9c8] text-xs font-semibold mb-1">{item.name}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-[#f0c040] font-mono text-sm">
                        {formatPrice(item.value * 12.2)}
                    </span>
                    <span className="text-[#c9a84c]/50 text-[10px]">للوحدة</span>
                </div>
            </div>
        );
    }
    return null;
}
