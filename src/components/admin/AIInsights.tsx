"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Insight {
    type: 'trend' | 'warning' | 'opportunity' | 'customer';
    title_ar: string;
    insight_ar: string;
    data_point: string;
    recommendation_ar: string;
    icon: string;
}

export default function AIInsights() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/ai-insights", { method: "POST" });
            if (!res.ok) throw new Error("تعذر تحميل التحليل، حاول مجدداً");
            const data = await res.json();
            setInsights(data);
            setLastUpdated(new Date().toLocaleTimeString("ar-SA", { hour: '2-digit', minute: '2-digit' }));
        } catch (err: any) {
            setError(err.message || "تعذر تحميل التحليل، حاول مجدداً");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    return (
        <section className="mt-12 bg-[#0A0806] border border-white/5 rounded-2xl p-6 md:p-8" dir="rtl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-arabic font-semibold text-[#EBE5D9] flex items-center gap-2">
                        <span>✨</span> تحليل ذكي
                    </h2>
                    {lastUpdated && !loading && (
                        <p className="text-xs text-[#EBE5D9]/40 mt-1 font-sans">
                            آخر تحديث: {lastUpdated}
                        </p>
                    )}
                </div>
                <button
                    onClick={fetchInsights}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-[#D4AF37]/20 rounded-lg text-sm font-arabic text-[#D4AF37] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                    )}
                    تحديث
                </button>
            </div>

            {error ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#EBE5D9]/50">
                    <svg className="w-12 h-12 text-red-500/50 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="font-arabic">{error}</p>
                </div>
            ) : loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-6 h-48 animate-pulse border border-white/5"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {insights.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-xl p-6 hover:border-[#D4AF37]/30 transition-colors"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="text-3xl">{item.icon}</div>
                                <div>
                                    <h3 className="font-arabic font-semibold text-[#EBE5D9] text-lg">{item.title_ar}</h3>
                                    <p className="font-arabic text-[#EBE5D9]/60 text-sm mt-1 leading-relaxed">
                                        {item.insight_ar}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="font-arabic text-sm text-[#EBE5D9]/80 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                                    <span className="font-semibold text-[#D4AF37]">{item.data_point}</span>
                                </p>
                                <p className="font-arabic text-sm text-[#EBE5D9]/50 mt-2 bg-white/5 p-3 rounded-lg border border-white/5">
                                    💡 {item.recommendation_ar}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </section>
    );
}
