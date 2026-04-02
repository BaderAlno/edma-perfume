"use client";

import React from "react";

interface MarginBarProps {
    margin: number;
}

export default function MarginBar({ margin }: MarginBarProps) {
    // Clamp margin between -100 and 100 for visual bar, but use abs for percentage indicator
    const percentage = Math.min(100, Math.max(0, margin));
    
    let barColorClass = "from-[#5ab87a] to-[#a8e6c0]";
    if (margin < 20) {
        barColorClass = "from-[#d45a4a] to-[#f0907e]";
    } else if (margin < 45) {
        barColorClass = "from-[#c9a84c] to-[#f0c040]";
    }

    return (
        <div className="mt-4">
            <div className="flex justify-between items-center text-[11px] text-[#f5e9c8]/30 font-mono mb-2">
                <span className="text-[#f5e9c8]/70 font-semibold">{margin.toFixed(1)}%</span>
                <span>هامش الربح</span>
            </div>
            
            <div className="h-2 w-full bg-[#0a0800] rounded-full border border-[#c9a84c]/10 overflow-hidden">
                <div 
                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out ${barColorClass}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
