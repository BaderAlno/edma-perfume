"use client";
import { useState, useEffect, useMemo } from "react";
import { IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from "next/font/google";
import type { CostInputs, AccountingResult } from "@/types/accounting";
import AccountingMetrics from "@/components/accounting/AccountingMetrics";
import ProfitGrowthChart from "@/components/accounting/ProfitGrowthChart";
import CostSection from "@/components/accounting/CostSection";
import SummaryCard from "@/components/accounting/SummaryCard";
import MarginBar from "@/components/accounting/MarginBar";
import AiInsight from "@/components/accounting/AiInsight";
import CostDistributionChart from "@/components/accounting/CostDistributionChart";
import AnnualGrowthRate from "@/components/accounting/AnnualGrowthRate";
import { useCurrency } from "@/context/CurrencyContext";

// ── Utils ───────────────────────────────────────────────────────────────────

function calculateAccounting(inputs: CostInputs): AccountingResult {
    const rawTotal = inputs.oil + inputs.alcohol + inputs.glass + inputs.otherRaw;
    const opsPerUnit = (inputs.monthlyRent / (inputs.unitsPerMonth || 1)) + inputs.packaging;
    const shippingTotal = inputs.shipping + inputs.localDelivery + inputs.customs;
    const totalCostPerUnit = rawTotal + opsPerUnit + shippingTotal;
    const totalRevenue = inputs.sellingPrice * inputs.unitsSold;
    const netProfit = (inputs.sellingPrice - totalCostPerUnit) * inputs.unitsSold;
    const marginPercent = inputs.sellingPrice > 0 ? ((inputs.sellingPrice - totalCostPerUnit) / inputs.sellingPrice) * 100 : 0;
    
    return {
        rawTotal,
        opsPerUnit,
        shippingTotal,
        totalCostPerUnit,
        totalRevenue,
        netProfit,
        marginPercent,
        topCostItem: "Raw Materials"
    };
}

function getAiInsights(inputs: CostInputs, result: AccountingResult): string[] {
    const insights = [];
    if (result.marginPercent > 50) insights.push("★ هامش ربح ممتاز (>50%). المنتج يحقق عوائد قوية جداً.");
    else if (result.marginPercent > 30) insights.push("✓ هامش ربح جيد جداً. استمر في تحسين العمليات.");
    else insights.push("⚠ هامش الربح منخفض. قد ترغب في مراجعة تكاليف المواد الخام أو زيادة سعر البيع.");
    
    if (inputs.oil > (result.totalCostPerUnit * 0.4)) insights.push("• الزيوت العطرية تشكل الجزء الأكبر من التكلفة. ابحث عن موردين بدلاء.");
    return insights;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-[#120e08] border border-[#c9a84c]/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#c9a84c]/5 rounded-bl-[100px] blur-2xl" />
            <h3 className="text-xs tracking-widest uppercase mb-6 text-[#c9a84c]/50 font-semibold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
                {title}
            </h3>
            {children}
        </div>
    );
}

const arabicFont = IBM_Plex_Sans_Arabic({
    subsets: ["arabic"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-ibm-plex-arabic",
});

const monoFont = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-ibm-plex-mono",
});

const PRESETS: Record<string, CostInputs> = {
    "فيلور": {
        oil: 1.200, alcohol: 0.400, glass: 0.800, otherRaw: 0.100,
        monthlyRent: 200, unitsPerMonth: 40, packaging: 0.300,
        shipping: 1.000, localDelivery: 0.500, customs: 0.000,
        sellingPrice: 18.000, unitsSold: 13
    },
    "سيسيلي": {
        oil: 0.900, alcohol: 0.350, glass: 0.700, otherRaw: 0.100,
        monthlyRent: 200, unitsPerMonth: 30, packaging: 0.250,
        shipping: 1.000, localDelivery: 0.500, customs: 0.000,
        sellingPrice: 15.000, unitsSold: 5
    },
    "إيلور": {
        oil: 1.500, alcohol: 0.500, glass: 1.000, otherRaw: 0.150,
        monthlyRent: 200, unitsPerMonth: 25, packaging: 0.400,
        shipping: 1.200, localDelivery: 0.500, customs: 0.000,
        sellingPrice: 22.000, unitsSold: 5
    },
    "مخصص": {
        oil: 0, alcohol: 0, glass: 0, otherRaw: 0,
        monthlyRent: 0, unitsPerMonth: 1, packaging: 0,
        shipping: 0, localDelivery: 0, customs: 0,
        sellingPrice: 0, unitsSold: 1
    }
};

export default function AccountingPage() {
    const { currency } = useCurrency();
    const [activeProduct, setActiveProduct] = useState("فيلور");
    const [inputs, setInputs] = useState<CostInputs>(PRESETS["فيلور"]);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("edma_accounting_presets");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed[activeProduct]) {
                    setInputs(parsed[activeProduct]);
                }
            } catch (e) {
                console.error("Failed to load presets", e);
            }
        }
    }, []);

    // Handle updates
    const handleUpdate = (id: string, value: number) => {
        setInputs(prev => ({ ...prev, [id]: value }));
    };

    // Auto-save to localStorage
    const handleSave = () => {
        const saved = localStorage.getItem("edma_accounting_presets");
        let allPresets = saved ? JSON.parse(saved) : { ...PRESETS };
        allPresets[activeProduct] = inputs;
        localStorage.setItem("edma_accounting_presets", JSON.stringify(allPresets));
        alert("تم حفظ البيانات بنجاح!");
    };

    // Switch product presets
    const switchProduct = (name: string) => {
        setActiveProduct(name);
        const saved = localStorage.getItem("edma_accounting_presets");
        const allPresets = saved ? JSON.parse(saved) : PRESETS;
        setInputs(allPresets[name] || PRESETS[name]);
    };

    const result = useMemo(() => calculateAccounting(inputs), [inputs]);
    const insights = useMemo(() => getAiInsights(inputs, result), [inputs, result]);

    return (
        <div className={`${arabicFont.variable} ${monoFont.variable} font-ibm-plex-arabic text-[#f5e9c8] min-h-screen relative`}>
            <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 py-8">
                {/* Right Sidebar Calculation Panel */}
                <aside className="w-full lg:w-[420px] bg-[#120e08] border border-[#c9a84c]/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] sticky top-8">
                    {/* Shimmer Border Top */}
                    <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" style={{ animation: "shimmer 3s ease-in-out infinite" }} />
                    
                    <div className="p-6 border-b border-[#c9a84c]/10 bg-[#120e08]/80 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-mono text-[11px] text-[#f5e9c8]/30 tracking-widest uppercase">SMART ACCOUNTING ENGINE v1.0</span>
                            <div className="flex items-center gap-2 text-lg font-bold text-[#f0c040]">
                                المحاسب الذكي
                                <div className="w-8 h-8 rounded-lg border border-[#c9a84c]/30 flex items-center justify-center bg-[#c9a84c]/5 text-sm uppercase">◈</div>
                            </div>
                        </div>

                        {/* Product Switcher Tabs */}
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(PRESETS).map(name => (
                                <button
                                    key={name}
                                    onClick={() => switchProduct(name)}
                                    className={`px-4 py-1.5 rounded-full text-xs transition-all border ${
                                        activeProduct === name 
                                        ? "bg-[#c9a84c]/20 border-[#c9a84c] text-[#f0c040]" 
                                        : "bg-[#1a1505] border-[#c9a84c]/10 text-[#f5e9c8]/50 hover:border-[#c9a84c]/30"
                                    }`}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[#c9a84c]/30">
                        {/* 1. Raw Materials */}
                        <CostSection
                            title="المواد الخام"
                            total={result.rawTotal}
                            onUpdate={handleUpdate}
                            items={[
                                { id: "oil", label: "زيت عطري", value: inputs.oil },
                                { id: "alcohol", label: "كحول", value: inputs.alcohol },
                                { id: "glass", label: "زجاج / عبوة", value: inputs.glass },
                                { id: "otherRaw", label: "مواد أخرى", value: inputs.otherRaw },
                            ]}
                        />

                        {/* 2. Operations */}
                        <CostSection
                            title="التشغيل والإيجار"
                            total={result.opsPerUnit}
                            onUpdate={handleUpdate}
                            items={[
                                { id: "monthlyRent", label: "إيجار المحل (شهري)", value: inputs.monthlyRent, step: 0.5 },
                                { id: "unitsPerMonth", label: "عدد الوحدات/شهر", value: inputs.unitsPerMonth, step: 1, unit: "وحدة" },
                                { id: "packaging", label: "تعبئة وتغليف", value: inputs.packaging },
                            ]}
                        />

                        {/* 3. Shipping */}
                        <CostSection
                            title="الشحن والتوصيل"
                            total={result.shippingTotal}
                            onUpdate={handleUpdate}
                            items={[
                                { id: "shipping", label: "تكلفة الشحن", value: inputs.shipping },
                                { id: "localDelivery", label: "رسوم التوصيل المحلي", value: inputs.localDelivery },
                                { id: "customs", label: "جمارك / رسوم أخرى", value: inputs.customs },
                            ]}
                        />

                        {/* 4. Revenue */}
                        <CostSection
                            title="سعر البيع والإيراد"
                            titleColor="text-[#f0c040]"
                            total={result.totalRevenue}
                            onUpdate={handleUpdate}
                            items={[
                                { id: "sellingPrice", label: "سعر بيع الوحدة", value: inputs.sellingPrice },
                                { id: "unitsSold", label: "عدد الوحدات المباعة", value: inputs.unitsSold, step: 1, unit: "وحدة" },
                            ]}
                        />

                        <div className="h-px bg-gradient-to-r from-transparent via-[#c9a84c]/20 to-transparent my-6" />

                        <SummaryCard result={result}>
                            <MarginBar margin={result.marginPercent} />
                        </SummaryCard>

                        <AiInsight insights={insights} />

                        <button 
                            onClick={handleSave}
                            className="w-full mt-6 py-4 rounded-xl border border-[#c9a84c] text-[#f0c040] text-sm font-semibold hover:bg-[#c9a84c]/10 transition-all active:scale-95 shadow-lg shadow-[#c9a84c]/5"
                        >
                            ◈ حفظ البيانات للمنتج
                        </button>
                        
                        <div className="h-8" />
                    </div>
                </aside>

                {/* Left Side: Financial Overview */}
                <main className="flex-1 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700 delay-150">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-3xl font-light text-[#EBE5D9]">نظرة عامة على المحاسبة</h2>
                        <p className="text-xs text-[#c9a84c]/40 font-mono tracking-wider">ANNUAL FINANCIAL PERFORMANCE & SIMULATION PROJECTIONS</p>
                    </div>

                    {/* Top 3 Metrics */}
                    <AccountingMetrics />

                    {/* Profit Growth Chart */}
                    <SectionCard title="نمو الأرباح الشهرية (صافي)">
                        <ProfitGrowthChart />
                    </SectionCard>
                    
                    {/* Additional simulated sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <SectionCard title="توزع التكاليف">
                            <CostDistributionChart 
                                rawTotal={result.rawTotal}
                                opsPerUnit={result.opsPerUnit}
                                shippingTotal={result.shippingTotal}
                            />
                         </SectionCard>
                         <SectionCard title="معدل النمو السنوي">
                            <AnnualGrowthRate />
                         </SectionCard>
                    </div>
                </main>
            </div>

            <style jsx global>{`
                @keyframes shimmer {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 1; }
                }
                .font-mono { font-family: var(--font-ibm-plex-mono), monospace; }
            `}</style>
        </div>
    );
}
