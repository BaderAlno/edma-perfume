"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";
import { useMotionValue } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import RevealText from "@/components/RevealText";
import ProductCard from "@/components/ProductCard";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

// Register once at module level — idempotent, safe to call multiple times.
// useGSAP must also be registered so React StrictMode double-invocation is
// handled correctly (the hook reverts the previous context before re-running).
gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ProductSection() {
    const { language } = useLanguage();
    const tProd = translations.productData;
    const tSection = translations.productsSection;
    const isRTL = language === "ar";

    /**
     * sectionRef   — GSAP pin trigger.  Must NOT have overflow:hidden; clipping
     *                is one level down (trackWrapRef) so GSAP's internal position
     *                bookkeeping is never disrupted.
     *
     * trackWrapRef — overflow:hidden wrapper.  Cards outside the viewport are
     *                hidden here, not on the pin target itself.
     *
     * trackRef     — flex row that GSAP translates on x.
     *                will-change:transform is set inline → browser promotes it to
     *                its own compositor layer before the first scroll tick, which
     *                eliminates the per-frame repaint that causes choppiness.
     *
     * progressRef  — progress-bar fill driven via direct DOM mutation in onUpdate
     *                to avoid React re-renders on every scroll tick.
     */
    const sectionRef = useRef<HTMLDivElement>(null);
    const trackWrapRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    // ── Stock status from Supabase ────────────────────────────────────────────
    // Maps product id (from translations, e.g. "elinor") → out_of_stock boolean.
    // Loaded once on mount; if Supabase is unavailable the map stays empty and
    // all products show as in-stock (graceful degradation).
    const [stockMap, setStockMap] = useState<Record<string, { qty: number; threshold: number }>>({});

    useEffect(() => {
        const supabase = createBrowserClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        supabase
            .from("products")
            .select("name, stock_quantity, low_stock_threshold")
            .eq("is_active", true)
            .then(({ data }) => {
                if (!data) return;
                const rows = data as { name: string; stock_quantity: number; low_stock_threshold: number }[];
                const map: Record<string, { qty: number; threshold: number }> = {};
                for (const row of rows) {
                    map[row.name.toLowerCase()] = { qty: row.stock_quantity, threshold: row.low_stock_threshold };
                }
                setStockMap(map);
            });
    }, []);

    // Framer Motion MotionValue for image parallax — ProductCard already reads it.
    // GSAP writes to it via onUpdate so both libraries stay in sync.
    const imageY = useMotionValue("0px");

    // ── Fix: disable scroll-behavior:smooth while this section is mounted ─────
    //
    // globals.css sets html { scroll-behavior: smooth }.  GSAP ScrollTrigger
    // reads window.scrollY at native scroll-event time, but smooth-scroll makes
    // the browser interpolate that value, producing a mismatch that manifests as
    // jitter/jumpiness on every pin frame.  Forcing "auto" removes the mismatch.
    useEffect(() => {
        const html = document.documentElement;
        const prev = html.style.scrollBehavior;
        html.style.scrollBehavior = "auto";
        return () => { html.style.scrollBehavior = prev; };
    }, []);

    // ── Reveal (fires once when section enters viewport) ──────────────────────
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    obs.unobserve(el);
                }
            },
            { threshold: 0.02 },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    // ── GSAP ScrollTrigger horizontal scroll ─────────────────────────────────
    //
    // useGSAP (from @gsap/react) replaces the manual useEffect + gsap.context()
    // pattern.  It:
    //   • Creates a GSAP context scoped to `sectionRef` automatically.
    //   • Calls ctx.revert() on unmount AND on every React StrictMode re-run,
    //     preventing the double-registration that StrictMode causes with plain
    //     useEffect and that produces stuttering in development builds.
    //   • Handles HMR correctly without leaving orphaned ScrollTriggers.
    useGSAP(
        () => {
            const track = trackRef.current;
            const progress = progressRef.current;
            if (!track) return;

            // Lazy function — recalculated on every ScrollTrigger.refresh() so
            // the travel distance is always exact after resize / orientation flip.
            const travel = () => Math.max(0, track.scrollWidth - window.innerWidth);

            gsap.to(track, {
                x: () => -travel(),
                ease: "none",

                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top top",
                    // Vertical scroll budget equals the horizontal travel distance.
                    end: () => `+=${travel()}`,
                    // scrub:1 — tween lags 1 s behind scroll for a silky feel.
                    scrub: 1,
                    pin: true,
                    // anticipatePin:1 — ScrollTrigger starts watching ~1 s before
                    // the pin point so the switch from scrolling→pinned is seamless
                    // (critical on iOS where momentum can overshoot the start point).
                    anticipatePin: 1,
                    // Recalculate start/end/travel on every browser resize.
                    invalidateOnRefresh: true,

                    onUpdate: (self) => {
                        // Image parallax: −20 px (0 %) → +20 px (100 %)
                        imageY.set(`${self.progress * 40 - 20}px`);

                        // Progress bar — direct DOM write, zero React overhead.
                        if (progress) {
                            progress.style.transform = `scaleX(${self.progress})`;
                        }
                    },
                },
            });
        },
        // scope: sectionRef limits selector lookups and ties cleanup to the element.
        // No dependencies needed — imageY is a stable MotionValue reference.
        { scope: sectionRef },
    );

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <section
            ref={sectionRef}
            id="products"
            dir={isRTL ? "rtl" : "ltr"}
            className="w-full min-h-screen bg-[#1A0E08] relative flex flex-col"
        // No overflow:hidden here — see trackWrapRef below.
        >
            {/* ── Background texture ──────────────────────────────────────── */}
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

            {/* ── Section header (static — does not translate horizontally) ── */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-16 flex-shrink-0">
                <div
                    className={`flex items-center gap-4 mb-4 reveal-text${isVisible ? " is-visible" : ""}`}
                    style={{ transitionDelay: "0ms" }}
                >
                    {isRTL ? (
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
                        isRTL
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
                    className={`reveal-text${isVisible ? " is-visible" : ""}${isRTL
                        ? " font-arabic text-[#D4AF37]/70 text-lg font-light max-w-xl"
                        : " font-sans uppercase tracking-widest text-[#D4AF37]/80 text-xs md:text-sm max-w-xl leading-relaxed"
                        }`}
                    style={{ transitionDelay: "200ms" }}
                >
                    {isRTL
                        ? "كل عطر، قصة لا تُنسى. اكتشفي مجموعتنا الحصرية من العطور الفاخرة."
                        : "Every perfume, an unforgettable story. Discover our exclusive luxury fragrance collection."}
                </p>
            </div>

            {/* ── Track wrapper: the overflow:hidden clip lives HERE ───────── */}
            {/*
             * Keeping overflow:hidden off the pin target (section) and on this
             * child wrapper is the correct GSAP pattern.  As GSAP translates
             * trackRef leftward, cards whose *painted* positions enter the
             * wrapper's clip region become visible — off-screen-right cards
             * slide in naturally without any layout thrashing.
             */}
            <div
                ref={trackWrapRef}
                className="relative z-10 overflow-hidden flex-1"
            >
                <div
                    ref={trackRef}
                    className="flex flex-row items-start gap-8 px-6 md:px-12 pb-16 h-full"
                    style={{
                        width: "max-content",
                        // Promote to its own GPU compositor layer before the first
                        // scroll tick so GSAP never triggers a per-frame repaint.
                        // This is the single biggest rendering-performance win.
                        willChange: "transform",
                    }}
                >
                    {tProd.map((product, idx) => (
                        /*
                         * No CSS transition on transform here — any transition
                         * on the animated axis would fight GSAP's inline style
                         * updates and produce the stuttering the user reported.
                         * Hover/tilt transitions live inside ProductCard on a
                         * child element that GSAP never touches, so they are safe.
                         */
                        <div
                            key={product.id}
                            className="flex-shrink-0"
                            style={{ width: "clamp(300px, 78vw, 480px)" }}
                        >
                            <ProductCard
                                product={product}
                                idx={idx}
                                language={language}
                                imageY={imageY}
                                isVisible={isVisible}
                                tSection={tSection}
                                outOfStock={stockMap[product.id.toLowerCase()]?.qty === 0}
                                lowStockQuantity={
                                    (stockMap[product.id.toLowerCase()]?.qty > 0 &&
                                        stockMap[product.id.toLowerCase()]?.qty <= (stockMap[product.id.toLowerCase()]?.threshold || 10))
                                        ? stockMap[product.id.toLowerCase()].qty
                                        : null
                                }
                                priority={idx < 2}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Scroll progress indicator ─────────────────────────────────── */}
            <div className="relative z-20 px-6 md:px-12 py-6 flex-shrink-0">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <div className="flex-1 h-px bg-[#D4AF37]/15 rounded-full overflow-hidden">
                        <div
                            ref={progressRef}
                            className="h-full bg-[#D4AF37]/60 rounded-full"
                            style={{
                                transform: "scaleX(0)",
                                transformOrigin: isRTL ? "right center" : "left center",
                                willChange: "transform",
                            }}
                        />
                    </div>
                    <span className="flex-shrink-0 font-sans text-[10px] uppercase tracking-widest text-[#D4AF37]/40 select-none">
                        {isRTL ? "مرر للاستكشاف" : "Scroll to explore"}
                    </span>
                </div>
            </div>
        </section>
    );
}
