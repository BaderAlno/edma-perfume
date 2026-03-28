"use client";

import { createContext, useContext, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export type Currency = "SAR" | "KWD" | "USD";

interface CurrencyContextValue {
    currency: Currency;
    setCurrency: (c: Currency) => void;
    /** Convert a SAR price value to the selected currency and return a formatted string */
    formatPrice: (sarValue: number) => string;
}

// ── Rates (base: SAR) ─────────────────────────────────────────────────────────
const RATES: Record<Currency, number> = {
    SAR: 1,
    KWD: 1 / 12.2,   // 1 KWD ≈ 12.2 SAR
    USD: 1 / 3.75,   // 1 USD ≈ 3.75 SAR
};

const SYMBOLS: Record<Currency, string> = {
    SAR: "SAR",
    KWD: "KWD",
    USD: "$",
};

// ── Context ───────────────────────────────────────────────────────────────────
const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<Currency>("SAR");

    const setCurrency = useCallback((c: Currency) => setCurrencyState(c), []);

    const formatPrice = useCallback(
        (sarValue: number): string => {
            const converted = sarValue * RATES[currency];
            const rounded   = Math.round(converted);
            const sym       = SYMBOLS[currency];
            return currency === "USD" ? `${sym} ${rounded}` : `${sym} ${rounded}`;
        },
        [currency]
    );

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency(): CurrencyContextValue {
    const ctx = useContext(CurrencyContext);
    if (!ctx) throw new Error("useCurrency must be used inside <CurrencyProvider>");
    return ctx;
}
