"use client";

import React from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer
} from "recharts";
import { useCurrency } from "@/context/CurrencyContext";

const data = [
    { name: "يناير", profit: 420 },
    { name: "فبراير", profit: 580 },
    { name: "مارس", profit: 490 },
    { name: "أبريل", profit: 710 },
    { name: "مايو", profit: 850 },
    { name: "يونيو", profit: 920 },
    { name: "يوليو", profit: 1100 },
    { name: "أغسطس", profit: 1050 },
    { name: "سبتمبر", profit: 1280 },
    { name: "أكتوبر", profit: 1420 },
    { name: "نوفمبر", profit: 1350 },
    { name: "ديسمبر", profit: 1540 },
];

export default function ProfitGrowthChart() {
    const { formatPrice } = useCurrency();

    return (
        <div className="w-full h-[320px] pb-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="rgba(201,168,76,0.05)" 
                        vertical={false} 
                    />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: "rgba(235,229,217,0.4)", fontSize: 11 }} 
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: "rgba(235,229,217,0.3)", fontSize: 10 }} 
                        tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                        content={<CustomTooltip formatPrice={formatPrice} />} 
                        cursor={{ stroke: "#c9a84c", strokeWidth: 1, strokeDasharray: "5 5" }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#c9a84c" 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#profitGradient)" 
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function CustomTooltip({ active, payload, label, formatPrice }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1a1505] border border-[#c9a84c]/30 p-3 rounded-lg shadow-2xl backdrop-blur-md">
                <p className="text-[#f5e9c8]/50 text-[10px] mb-1 font-mono uppercase tracking-wider">{label}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-[#f0c040] font-bold text-sm">
                        {formatPrice(payload[0].value * 12.2)}
                    </span>
                    <span className="text-[#c9a84c] text-[10px]">صافي الربح</span>
                </div>
            </div>
        );
    }
    return null;
}
