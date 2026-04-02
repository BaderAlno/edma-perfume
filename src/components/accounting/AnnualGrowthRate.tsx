"use client";

import React from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

const data = [
    { value: 10 }, { value: 15 }, { value: 25 }, { value: 20 },
    { value: 40 }, { value: 35 }, { value: 60 }, { value: 55 },
    { value: 85 }
];

export default function AnnualGrowthRate() {
    return (
        <div className="w-full flex flex-col items-center justify-center p-2">
            {/* Glowing Growth Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group w-full flex flex-col items-center justify-center"
            >
                {/* Radial Glow */}
                <div className="absolute inset-0 bg-[#c9a84c]/20 rounded-full blur-3xl scale-75 group-hover:scale-100 transition-transform duration-1000 opacity-40 group-hover:opacity-70" />

                <div className="relative font-mono text-5xl md:text-6xl font-bold text-[#f0c040] mb-2 drop-shadow-[0_0_15px_rgba(240,192,64,0.4)]">
                    +85%
                </div>

                <div className="text-[10px] text-[#f5e9c8]/40 font-mono tracking-widest uppercase mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Projected Annual ROI
                </div>

                {/* Sparkline */}
                <div className="w-full h-16 opacity-30 mt-2 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#c9a84c" 
                                fill="#c9a84c" 
                                strokeWidth={1}
                                fillOpacity={0.2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* AI Insight Paragraph */}
                <div className="relative p-3 rounded-lg border border-[#c9a84c]/10 bg-gradient-to-br from-[#c9a84c]/5 to-transparent text-[11px] leading-relaxed text-[#f5e9c8]/50 text-right w-full">
                    <span className="text-[#c9a84c] mb-1 block font-bold uppercase tracking-wider text-[9px]">AI Projection Insights</span>
                    بناءً على المعطيات الحالية، يُتوقع نمو سنوي قوي يتجاوز 80% نتيجة لزيادة الكفاءة التشغيلية الملحوظة في خط الإنتاج. الاستمرار في خفض تكاليف المواد الخام سيعزز هذا الاتجاه.
                </div>
            </motion.div>
        </div>
    );
}
