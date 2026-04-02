"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrency, type Currency } from "@/context/CurrencyContext";

const CURRENCIES: Currency[] = ["SAR", "KWD", "USD"];

export default function CurrencySwitcher() {
    const { currency, setCurrency } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handler = () => setIsOpen(false);
        document.addEventListener("click", handler, { capture: true });
        return () => document.removeEventListener("click", handler, { capture: true });
    }, [isOpen]);

    return (
        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={() => setIsOpen(o => !o)}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label="Select currency"
                className="flex items-center gap-1.5 text-xs tracking-widest font-light transition-all duration-300 px-3 py-1.5 rounded-md hover:bg-white/5 text-[#D4AF37] border border-[#D4AF37]/10 hover:border-[#D4AF37]/30"
            >
                <span className="font-medium">{currency}</span>
                <svg 
                    className={`w-2.5 h-2.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
                    fill="none" 
                    viewBox="0 0 10 6" 
                    stroke="currentColor" 
                    strokeWidth={1.8} 
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l4 4 4-4" />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        role="listbox"
                        aria-label="Currency options"
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 right-0 bg-[#0A0806]/95 backdrop-blur-xl border border-[#D4AF37]/20 rounded-lg overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-w-[80px] z-[100]"
                    >
                        {CURRENCIES.map((c) => (
                            <li
                                key={c}
                                role="option"
                                aria-selected={c === currency}
                                onClick={() => { 
                                    setCurrency(c); 
                                    setIsOpen(false); 
                                }}
                                className={`px-4 py-2.5 text-xs tracking-widest cursor-pointer transition-colors duration-150 ${
                                    c === currency
                                        ? "text-[#D4AF37] bg-[#D4AF37]/10"
                                        : "text-[#EBE5D9]/55 hover:text-[#EBE5D9] hover:bg-white/5"
                                }`}
                            >
                                {c}
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}
