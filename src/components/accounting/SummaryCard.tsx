"use client";

import type { AccountingResult } from "@/types/accounting";
import { useCurrency } from "@/context/CurrencyContext";

interface SummaryCardProps {
    result: AccountingResult;
    children?: React.ReactNode;
}

export default function SummaryCard({ result, children }: SummaryCardProps) {
    const {
        rawTotal,
        opsPerUnit,
        shippingTotal,
        totalCostPerUnit,
        totalRevenue,
        netProfit,
    } = result;
    const { formatPrice } = useCurrency();
    
    // Accounting logic is base KWD. formatPrice expects SAR.
    // 1 KWD = 12.2 SAR.
    const toSAR = (kwd: number) => kwd * 12.2;
    const format = (kwd: number) => formatPrice(toSAR(kwd));

    const isLoss = netProfit < 0;

    return (
        <div className="relative overflow-hidden p-5 rounded-xl border border-[#c9a84c]/20 bg-gradient-to-br from-[#1a1505] to-[#221c07] shadow-2xl">
            {/* Subtle glow background */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#c9a84c]/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="text-[11px] text-[#8a6f30] tracking-[2px] font-mono mb-3 text-right uppercase">
                ملخص التكاليف والأرباح
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-[13px] border-b border-[#c9a84c]/5 py-2">
                    <span className="font-mono font-semibold text-[#d45a4a] animate-in fade-in slide-in-from-bottom-1 duration-300">
                        {format(rawTotal)}
                    </span>
                    <span className="text-[#f5e9c8]/50 text-[#d45a4a]">إجمالي تكلفة الخامات</span>
                </div>

                <div className="flex justify-between items-center text-[13px] border-b border-[#c9a84c]/5 py-2">
                    <span className="font-mono font-semibold text-[#d45a4a] animate-in fade-in slide-in-from-bottom-1 duration-300">
                        {format(opsPerUnit)}
                    </span>
                    <span className="text-[#f5e9c8]/50 text-[#d45a4a]">تكلفة التشغيل (للوحدة)</span>
                </div>

                <div className="flex justify-between items-center text-[13px] border-b border-[#c9a84c]/5 py-2">
                    <span className="font-mono font-semibold text-[#d45a4a] animate-in fade-in slide-in-from-bottom-1 duration-300">
                        {format(shippingTotal)}
                    </span>
                    <span className="text-[#f5e9c8]/50 text-[#d45a4a]">تكلفة الشحن والتوصيل</span>
                </div>

                {/* Highlight - Total Cost */}
                <div className="flex justify-between items-center border-t border-[#c9a84c]/10 pt-3 mt-1">
                    <span className="font-mono font-bold text-lg text-[#d45a4a] animate-in fade-in slide-in-from-bottom-1 duration-300">
                        {format(totalCostPerUnit)}
                    </span>
                    <span className="text-[#f5e9c8] font-medium text-[13px]">إجمالي التكلفة</span>
                </div>

                {/* Revenue */}
                <div className="flex justify-between items-center py-2">
                    <span className="font-mono font-semibold text-[#f0c040] animate-in fade-in slide-in-from-bottom-1 duration-300">
                        {format(totalRevenue)}
                    </span>
                    <span className="text-[#f0c040] text-[13px]">إجمالي الإيراد</span>
                </div>

                {/* NET PROFIT/LOSS */}
                <div className="flex justify-between items-center border-t-2 border-[#c9a84c]/30 pt-4 mt-2">
                    <span 
                        className={`font-mono font-bold text-2xl animate-in scale-in-95 duration-500 ${isLoss ? "text-[#d45a4a] shadow-[0_0_20px_rgba(212,90,74,0.4)]" : "text-[#5ab87a] shadow-[0_0_20px_rgba(90,184,122,0.4)]"}`}
                        style={{ textShadow: `0 0 20px ${isLoss ? 'rgba(212, 90, 74, 0.4)' : 'rgba(90, 184, 122, 0.4)'}` }}
                    >
                        {format(Math.abs(netProfit))}
                    </span>
                    <span className={`font-semibold text-sm ${isLoss ? "text-[#d45a4a]" : "text-[#5ab87a]"}`}>
                        {isLoss ? "خسارة صافية ▼" : "صافي الربح ▲"}
                    </span>
                </div>
            </div>

            {children}
        </div>
    );
}
