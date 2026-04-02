"use client";

import React from "react";

interface AiInsightProps {
    insights: string[];
}

export default function AiInsight({ insights }: AiInsightProps) {
    if (insights.length === 0) return null;

    return (
        <div className="relative mt-4 p-4 rounded-xl border border-[#c9a84c]/20 bg-gradient-to-br from-[#c9a84c]/5 to-transparent text-[12.5px] leading-relaxed text-[#f5e9c8]/50 overflow-hidden group">
            {/* Shimmer top border line logic is handled in the CSS, but let's add a visual cue here too */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9a84c]/50 to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />

            <div className="text-[10px] text-[#c9a84c] font-bold tracking-[1.5px] mb-3 uppercase flex items-center gap-2">
                <span className="animate-pulse">◆</span> تحليل ذكي
            </div>

            <div className="space-y-3">
                {insights.map((text, i) => (
                    <p 
                        key={i} 
                        className="animate-in fade-in slide-in-from-right-2 duration-500 fill-mode-both"
                        style={{ animationDelay: `${i * 100}ms` }}
                        dangerouslySetInnerHTML={{ __html: text }}
                    />
                ))}
            </div>
        </div>
    );
}
