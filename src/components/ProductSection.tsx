"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";
import { useTransform, useScroll } from "framer-motion";
import RevealText from "@/components/RevealText";
import ProductCard from "@/components/ProductCard";

export default function ProductSection() {
    const { language } = useLanguage();
    const tProd    = translations.productData;
    const tSection = translations.productsSection;

    const containerRef = useRef<HTMLDivElement>(null);

    // Shared parallax for product images (still works in grid layout)
    const { scrollYProgress } = useScroll({
        target:  containerRef,
        offset:  ["start end", "end start"],
    });
    const imageY = useTransform(scrollYProgress, [0, 1], ["-20px", "20px"]);

    // ── Section reveal (fires once) ─────────────────────────────────────────
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    obs.unobserve(el);
                }
            },
            { threshold: 0.08 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <section
            ref={containerRef}
            id="products"
            dir={language === "ar" ? "rtl" : "ltr"}
            className="w-full bg-[#1A0E08] relative overflow-x-hidden"
            style={{ position: "relative" }}
        >
            {/* Background texture */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1A0E08] via-[#2A1810] to-[#1A0E08] pointer-events-none" />
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div
                    className="w-full h-full"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(45deg, #D4AF37 0px, #D4AF37 1px, transparent 1px, transparent 20px)",
                    }}
                />
            </div>

            {/* ── Section header ──────────────────────────────────────────── */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-16">
                <div
                    className={`flex items-center gap-4 mb-4 reveal-text${isVisible ? " is-visible" : ""}`}
                    style={{ transitionDelay: "0ms" }}
                >
                    {language === "ar" ? (
                        <>
                            <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-[#D4AF37] to-transparent" />
                            <span className="text-[#D4AF37] text-xs tracking-[0.35em] uppercase font-light">
                                مجموعتنا
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="text-[#D4AF37] text-xs tracking-[0.35em] uppercase font-light">
                                Our Collection
                            </span>
                            <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-[#D4AF37] to-transparent" />
                        </>
                    )}
                </div>

                <h2
                    className={
                        language === "ar"
                            ? "font-arabic text-5xl md:text-7xl font-light text-[#EBE5D9] leading-snug drop-shadow-sm mb-6"
                            : "font-serif text-5xl md:text-7xl font-light text-[#EBE5D9] leading-snug tracking-wide drop-shadow-sm mb-6"
                    }
                >
                    <RevealText
                        text={translations.shopPage.title[language]}
                        language={language}
                        delay={0.1}
                    />
                </h2>

                <p
                    className={`reveal-text${isVisible ? " is-visible" : ""}${
                        language === "ar"
                            ? " font-arabic text-[#D4AF37]/70 text-lg font-light max-w-xl"
                            : " font-sans uppercase tracking-widest text-[#D4AF37]/80 text-xs md:text-sm max-w-xl leading-relaxed"
                    }`}
                    style={{ transitionDelay: "200ms" }}
                >
                    {language === "ar"
                        ? "كل عطر، قصة لا تُنسى. اكتشفي مجموعتنا الحصرية من العطور الفاخرة."
                        : "Every perfume, an unforgettable story. Discover our exclusive luxury fragrance collection."}
                </p>
            </div>

            {/* ── Product cards grid ──────────────────────────────────────── */}
            <div
                className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pb-24"
                style={{ overflow: "hidden" }}
            >
                <div
                    style={{
                        display:             "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                        gap:                 "2rem",
                        width:               "100%",
                        maxWidth:            "100%",
                    }}
                >
                    {tProd.map((product, idx) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            idx={idx}
                            language={language}
                            imageY={imageY}
                            isVisible={isVisible}
                            tSection={tSection}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
