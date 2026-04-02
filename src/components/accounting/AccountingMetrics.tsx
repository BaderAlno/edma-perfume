"use client";

import React from "react";
import MetricCard from "@/components/admin/MetricCard";

interface AccountingMetricsProps {
    // We can pass actual stats here if needed, but for now we'll use mock data
    // as requested by the user for the simulation overview.
}

export default function AccountingMetrics({}: AccountingMetricsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <MetricCard
                label="إجمالي الأرباح"
                value={1240.450}
                isCurrency={true}
                change={14.2}
                changeDirection="up"
                icon={<IconProfit />}
            />
            <MetricCard
                label="إجمالي التكاليف"
                value={850.120}
                isCurrency={true}
                change={5.8}
                changeDirection="down"
                icon={<IconCost />}
            />
            <MetricCard
                label="أعلى هامش ربح"
                value="فيلور"
                suffix="58.3%"
                icon={<IconStar />}
            />
        </div>
    );
}

// ── Inline Icons ─────────────────────────────────────────────────────────────

function IconProfit() {
    return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22m5-18H8.5a4.5 4.5 0 0 0 0 9h7a4.5 4.5 0 0 1 0 9H7" /></svg>;
}

function IconCost() {
    return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>;
}

function IconStar() {
    return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
}
