"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, MotionValue } from "framer-motion";
import RevealText from "@/components/RevealText";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { translations } from "@/i18n/translations";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_TILT = 15; // degrees
const FALLBACK_IMAGE = "/product_bottle1.png";

// ─── Types ────────────────────────────────────────────────────────────────────
type Product = (typeof translations.productData)[0];
type Lang = "en" | "ar";

interface ProductCardProps {
    product: Product;
    idx: number;
    language: Lang;
    /** Parallax motion value shared from parent scroll context */
    imageY: MotionValue<string>;
    /** Whether the parent section has entered the viewport (for staggered reveal) */
    isVisible: boolean;
    tSection: typeof translations.productsSection;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProductCard({
    product,
    idx,
    language,
    imageY,
    isVisible,
    tSection,
}: ProductCardProps) {
    // ── Cart ───────────────────────────────────────────────────────────────
    const { addItem, openCart } = useCart();
    const { formatPrice } = useCurrency();
    const [added, setAdded] = useState(false);
    const [imgSrc, setImgSrc] = useState(product.image || FALLBACK_IMAGE);

    const handleAddToCart = useCallback(() => {
        addItem(product);
        openCart();
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
    }, [addItem, openCart, product]);

    // ── Tilt state ─────────────────────────────────────────────────────────
    const cardRef  = useRef<HTMLDivElement>(null);
    const rafRef   = useRef<number>(0);
    // Buffer latest mouse position so RAF always reads the freshest coords
    const mouse    = useRef<{ x: number; y: number } | null>(null);

    const [rotX, setRotX]       = useState(0);
    const [rotY, setRotY]       = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // ── Shine state ────────────────────────────────────────────────────────
    // shineX/Y are percentages (0–100) within the card; opacity drives visibility
    const [shine, setShine] = useState({ x: 50, y: 50, opacity: 0 });

    // Cancel any pending RAF when the component unmounts
    useEffect(() => () => { cancelAnimationFrame(rafRef.current); }, []);

    // ── Mouse handlers ─────────────────────────────────────────────────────
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // Write latest position — RAF will consume it
        mouse.current = { x: e.clientX, y: e.clientY };

        // Schedule exactly one RAF per frame; skip if one is already queued
        if (rafRef.current) return;

        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = 0; // clear handle so next move can schedule again
            const pos = mouse.current;
            const el  = cardRef.current;
            if (!pos || !el) return;

            const rect = el.getBoundingClientRect();

            // Normalised position within card: −1 (left/top) … +1 (right/bottom)
            const relX = (pos.x - rect.left  - rect.width  / 2) / (rect.width  / 2);
            const relY = (pos.y - rect.top   - rect.height / 2) / (rect.height / 2);

            // Clamp to ±MAX_TILT degrees
            const newRotY =  Math.max(-MAX_TILT, Math.min(MAX_TILT,  relX * MAX_TILT));
            const newRotX =  Math.max(-MAX_TILT, Math.min(MAX_TILT, -relY * MAX_TILT));

            // Shine centre tracks raw cursor inside card (0–100 %)
            const sx = Math.max(0, Math.min(100, ((pos.x - rect.left) / rect.width)  * 100));
            const sy = Math.max(0, Math.min(100, ((pos.y - rect.top)  / rect.height) * 100));

            setRotX(newRotX);
            setRotY(newRotY);
            setShine({ x: sx, y: sy, opacity: 1 });
        });
    }, []);

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);

    const handleMouseLeave = useCallback(() => {
        // Cancel any in-flight RAF so stale coords don't overwrite the reset
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
        mouse.current  = null;

        setIsHovered(false);
        setRotX(0);
        setRotY(0);
        setShine(prev => ({ ...prev, opacity: 0 }));
    }, []);

    // ── Derived styles ─────────────────────────────────────────────────────
    // While the mouse is active: near-instant tracking (80 ms)
    // On mouse-leave: spring back over 650 ms
    const tiltTransform  = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    const tiltTransition = isHovered
        ? "transform 0.08s linear, box-shadow 0.08s linear"
        : "transform 0.65s cubic-bezier(0.03, 0.98, 0.52, 0.99), box-shadow 0.65s cubic-bezier(0.03, 0.98, 0.52, 0.99)";

    // Elevate shadow in the tilt direction for extra depth
    const tiltShadow = isHovered
        ? `${rotY * -1.2}px ${rotX * 1.2}px 40px rgba(201, 168, 76, 0.25), 0 20px 60px rgba(0,0,0,0.45)`
        : "0 0 0 rgba(0,0,0,0)";

    // Shine gradient follows the cursor
    const shineGradient = `radial-gradient(
        circle at ${shine.x}% ${shine.y}%,
        rgba(255, 228, 140, 0.22)  0%,
        rgba(255, 228, 140, 0.07) 40%,
        transparent               70%
    )`;

    return (
        /*
         * ── Layer 1: Reveal wrapper ──────────────────────────────────────────
         * Controls scroll-reveal animation (translateY + opacity via CSS class).
         * Owns the sizing and flex-shrink so the card occupies the right slot in
         * the horizontal track regardless of tilt state.
         */
        <div
            id={`product-${product.id}`}
            className={`w-full min-w-0 flex flex-col reveal-text${isVisible ? " is-visible" : ""}`}
            style={{ transitionDelay: `${100 + idx * 150}ms` }}
        >
            {/*
             * ── Layer 2: Tilt wrapper ────────────────────────────────────────
             * Applies the 3-D perspective transform independently of the reveal
             * animation on Layer 1 (separate elements = no transform conflict).
             */}
            <div
                ref={cardRef}
                className="h-full flex flex-col"
                style={{
                    transform:   tiltTransform,
                    transition:  tiltTransition,
                    boxShadow:   tiltShadow,
                    willChange:  "transform",
                }}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/*
                 * ── Layer 3: Card body ───────────────────────────────────────
                 * All visual styling lives here. overflow-hidden is on THIS
                 * element so it doesn't interfere with 3-D compositing above.
                 */}
                <div className="group relative flex flex-col h-full bg-gradient-to-b from-[#2A1810] to-[#1A0E08] border border-[#D4AF37]/15 overflow-hidden transition-[border-color] duration-700 ease-out hover:border-[#D4AF37]/40">

                    {/* ── Shine overlay ─────────────────────────────────── */}
                    <div
                        aria-hidden
                        className="absolute inset-0 z-20 pointer-events-none"
                        style={{
                            background:  shineGradient,
                            opacity:     shine.opacity,
                            transition:  isHovered
                                ? "opacity 0.12s ease"
                                : "opacity 0.5s ease",
                        }}
                    />

                    {/* ── Product image with parallax ───────────────────── */}
                    <div
                        className={`cursor-none reveal-image${isVisible ? " is-visible" : ""}`}
                        style={{
                            position:        "relative",
                            overflow:        "hidden",
                            height:          "480px",
                            padding:         "20px",
                            background:      product.bgFrom,
                            transitionDelay: `${150 + idx * 150}ms`,
                        }}
                        data-cursor-text={language === "ar" ? "عرض" : "VIEW"}
                    >
                        <motion.div
                            style={{ y: imageY }}
                            className="w-full h-full pointer-events-none"
                        >
                            <Image
                                src={imgSrc}
                                alt={product.name[language]}
                                fill
                                className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                                onError={() => setImgSrc(FALLBACK_IMAGE)}
                            />
                        </motion.div>

                        {/* Radial glow on hover */}
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-700 ease-out pointer-events-none"
                            style={{
                                background: `radial-gradient(circle at 50% 80%, ${product.accent}, transparent 60%)`,
                            }}
                        />
                    </div>

                    {/* ── Product info ──────────────────────────────────── */}
                    <div className="relative z-10 flex-1 flex flex-col p-6 md:p-8 w-full min-w-0 mt-8">

                        {/* Variable-length content — grows to push footer down */}
                        <div className="flex-1 w-full min-w-0">

                        {/* Name */}
                        <div className="mb-6">
                            <h3
                                className={
                                    language === "ar"
                                        ? "font-arabic text-3xl font-light mb-2 drop-shadow-sm"
                                        : "font-serif text-3xl font-light mb-2 tracking-wide drop-shadow-sm"
                                }
                                style={{ color: product.accent }}
                            >
                                <RevealText
                                    text={product.name[language]}
                                    language={language}
                                    delay={0.2}
                                />
                            </h3>
                            <p className="text-[#EBE5D9]/40 text-xs tracking-[0.3em] uppercase font-light">
                                {product.nameEn?.en || product.name.en}
                            </p>
                        </div>

                        {/* Gold divider */}
                        <div
                            className="w-16 h-px mb-6"
                            style={{
                                background:
                                    language === "ar"
                                        ? `linear-gradient(to right, transparent, ${product.accent})`
                                        : `linear-gradient(to left,  transparent, ${product.accent})`,
                            }}
                        />

                        {/* Tagline */}
                        <p
                            className={
                                language === "ar"
                                    ? "font-arabic text-base font-medium mb-4 break-words whitespace-normal"
                                    : "font-sans text-xs uppercase tracking-widest font-medium mb-4 break-words whitespace-normal"
                            }
                            style={{ color: product.accent }}
                        >
                            {product.desc[language]}
                        </p>

                        {/* Story */}
                        <p
                            className={
                                language === "ar"
                                    ? "font-arabic text-[#EBE5D9]/70 text-sm md:text-base leading-relaxed mb-8 font-light break-words whitespace-normal"
                                    : "font-sans text-[#EBE5D9]/70 text-sm leading-relaxed mb-8 font-light break-words whitespace-normal"
                            }
                        >
                            {product.story[language]}
                        </p>

                        {/* Notes */}
                        <div className="mb-8">
                            <p
                                className={
                                    language === "ar"
                                        ? "text-[#D4AF37]/50 text-xs mb-3 tracking-wider font-arabic"
                                        : "text-[#D4AF37]/50 text-[10px] mb-3 tracking-[0.2em] font-sans uppercase"
                                }
                            >
                                {language === "ar" ? "النوتات" : "Notes"}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {product.notes[language].map((note) => (
                                    <span
                                        key={note}
                                        className={
                                            language === "ar"
                                                ? "font-arabic text-xs border px-4 py-1.5 rounded-full transition-colors duration-300"
                                                : "font-sans uppercase text-[10px] tracking-widest border px-4 py-1.5 rounded-full transition-colors duration-300"
                                        }
                                        style={{
                                            borderColor: `${product.accent}40`,
                                            color:       `${product.accent}CC`,
                                            background:  `${product.accent}10`,
                                        }}
                                    >
                                        {note}
                                    </span>
                                ))}
                            </div>
                        </div>

                        </div>{/* end flex-1 variable content */}

                        {/* Price — anchored above button */}
                        <p
                            className="font-sans text-2xl font-light tracking-wide mb-4 mt-2"
                            style={{ color: product.accent }}
                        >
                            {formatPrice(product.priceValue)}
                        </p>

                        {/* Order button */}
                        <div className="flex flex-col gap-4 mt-4">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-red-500/80 animate-pulse" />
                                <span
                                    className={
                                        language === "ar"
                                            ? "font-arabic text-xs text-[#EBE5D9]/70 tracking-wide"
                                            : "font-sans text-[10px] uppercase tracking-wider text-[#EBE5D9]/70"
                                    }
                                >
                                    {tSection.exclusive[language]}
                                </span>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    id={`order-btn-${product.id}`}
                                    onClick={handleAddToCart}
                                    className={
                                        language === "ar"
                                            ? "flex-1 text-center py-4 font-arabic text-sm font-medium tracking-wide transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] active:scale-[0.98] rounded-full"
                                            : "flex-1 text-center py-4 font-sans text-xs uppercase font-semibold tracking-[0.15em] transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] active:scale-[0.98] rounded-full"
                                    }
                                    style={{
                                        background: added
                                            ? `linear-gradient(135deg, #2A7A2A, #3A9A3A)`
                                            : `linear-gradient(135deg, ${product.accent}, ${product.accent}CC)`,
                                        color: "#1A0E08",
                                        transition: "background 0.4s ease, transform 0.3s ease, box-shadow 0.3s ease",
                                    }}
                                >
                                    {added ? tSection.added[language] : tSection.addToCart[language]}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
