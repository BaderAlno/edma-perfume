"use client";

import React from "react";
import { useCurrency } from "@/context/CurrencyContext";

interface CostItem {
    id: string;
    label: string;
    value: number;
    step?: number;
    unit?: string;
}

interface CostSectionProps {
    title: string;
    items: CostItem[];
    total: number;
    onUpdate: (id: string, value: number) => void;
    titleColor?: string;
}

export default function CostSection({
    title,
    items,
    total,
    onUpdate,
    titleColor = "text-[#8a6f30]"
}: CostSectionProps) {
    const { currency, formatPrice } = useCurrency();
    const toSAR = (kwd: number) => kwd * 12.2;
    return (
        <section className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#c9a84c]/10">
                <h3 className={`text-xs font-semibold uppercase tracking-[1.5px] flex items-center gap-2 ${titleColor}`}>
                    <span className="w-[3px] h-3 bg-[#c9a84c] rounded-sm block" />
                    {title}
                </h3>
                <div className="font-mono text-[13px] font-semibold text-[#f5e9c8]/50">
                    {formatPrice(toSAR(total))}
                </div>
            </div>

            {/* Rows */}
            <div className="space-y-1">
                {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-2 border-b border-[#c9a84c]/5 last:border-b-0">
                        <div className="flex-1 text-[13px] text-[#f5e9c8]/50 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8a6f30] flex-shrink-0" />
                            {item.label}
                        </div>
                        
                        <div className="flex items-center bg-[#1a1505] border border-[#c9a84c]/10 rounded-md overflow-hidden focus-within:border-[#c9a84c] transition-all group">
                            <input
                                type="number"
                                value={item.value || ""}
                                onChange={(e) => onUpdate(item.id, parseFloat(e.target.value) || 0)}
                                step={item.step || 0.001}
                                min={0}
                                placeholder="0.000"
                                className="bg-transparent border-none outline-none text-[#f5e9c8] font-mono text-[13px] w-[90px] px-3 h-8 text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                dir="ltr"
                            />
                            <div className="px-2 text-[11px] text-[#8a6f30] font-mono border-l border-[#c9a84c]/10 h-8 flex items-center bg-[#110e02]">
                                {item.unit || currency}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
