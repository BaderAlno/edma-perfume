"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useReveal } from "@/hooks/useReveal";

const EN_PHRASE = "\u00A0\u00A0INVISIBLE ELEGANCE \u2022 UNFORGETTABLE PRESENCE \u2022";
const AR_PHRASE = "\u00A0\u00A0أناقة خفية \u2022 حضور لا يُنسى \u2022";

export default function MarqueeTicker() {
    const { language } = useLanguage();
    const phrase = language === "ar" ? AR_PHRASE : EN_PHRASE;
    const fontClass = language === "ar" ? "font-arabic" : "font-sans";
    const [ref, isVisible] = useReveal<HTMLDivElement>({ threshold: 0.3 });

    return (
        <div
            ref={ref}
            className={`w-full bg-[#0A0806] overflow-hidden py-3 border-y border-[#C9A84C]/20 reveal-text${isVisible ? " is-visible" : ""}`}
            aria-label={language === "ar" ? "شريط الرسائل" : "Message ticker"}
            dir="ltr"
        >
            <div className="flex whitespace-nowrap animate-marquee">
                <span
                    className={`${fontClass} text-[#C9A84C] text-[11px] tracking-[0.35em] font-light uppercase inline-block`}
                    aria-hidden="true"
                >
                    {Array(10).fill(phrase).join("")}
                </span>
                <span
                    className={`${fontClass} text-[#C9A84C] text-[11px] tracking-[0.35em] font-light uppercase inline-block`}
                    aria-hidden="true"
                >
                    {Array(10).fill(phrase).join("")}
                </span>
            </div>
        </div>
    );
}
