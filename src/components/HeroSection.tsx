"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, useMotionValueEvent, motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";
import RevealText from "@/components/RevealText";
import ScrambleTitle from "@/components/ScrambleTitle";
import ParticleBackground from "@/components/ParticleBackground";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const TOTAL_FRAMES = 240;

// Build array of frame URLs from /sequence/
function buildFrameUrls(): string[] {
    return Array.from({ length: TOTAL_FRAMES }, (_, i) => {
        const n = (i + 1).toString().padStart(3, "0");
        return `/sequence/ezgif-frame-${n}.jpg`;
    });
}

function drawImageCover(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    canvas: HTMLCanvasElement
) {
    const cW = canvas.width;
    const cH = canvas.height;
    const iW = img.naturalWidth || img.width;
    const iH = img.naturalHeight || img.height;

    if (!iW || !iH) return;

    const cRatio = cW / cH;
    const iRatio = iW / iH;

    let dW: number, dH: number, oX: number, oY: number;

    if (cRatio > iRatio) {
        dW = cW;
        dH = iH * (cW / iW);
        oX = 0;
        oY = (cH - dH) / 2;
    } else {
        dH = cH;
        dW = iW * (cH / iH);
        oX = (cW - dW) / 2;
        oY = 0;
    }

    // Clear to transparent so only the JPEG pixels are drawn.
    // The canvas element itself uses opacity < 1, letting the video show through.
    ctx.clearRect(0, 0, cW, cH);

    ctx.drawImage(img, oX, oY, dW, dH);
}

export default function HeroSection() {
    const containerRef     = useRef<HTMLDivElement>(null);
    const canvasRef        = useRef<HTMLCanvasElement>(null);
    const imagesRef        = useRef<HTMLImageElement[]>([]);
    const loadedRef        = useRef<boolean[]>(new Array(TOTAL_FRAMES).fill(false));
    const currentFrameRef  = useRef(0);

    // ── GSAP parallax refs ────────────────────────────────────────────────────
    // Layer 1 (background, 0.1x): subtle atmospheric gradient behind the canvas
    const bgLayerRef       = useRef<HTMLDivElement>(null);
    // Layer 2 (bottle, 0.3x): the canvas itself, via a wrapper
    const bottleLayerRef   = useRef<HTMLDivElement>(null);
    // Layer 3 (headline, 0.5x): text overlay wrapper
    const headlineLayerRef = useRef<HTMLDivElement>(null);

    const { language } = useLanguage();
    const t = translations.hero;
    const [heroVisible, setHeroVisible] = useState(false);

    // Scroll progress relative only to THIS hero section container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Map scroll 0→1 to frame 0→239
    const frameIndex = useTransform(scrollYProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

    // Overlay text opacity: fades in from scroll 35% → 55%, stays until end
    const overlayOpacity = useTransform(scrollYProgress, [0.3, 0.55], [0, 1]);
    const overlayY       = useTransform(scrollYProgress, [0.3, 0.55], [50, 0]);

    // CTA button fades in a little later
    const ctaOpacity = useTransform(scrollYProgress, [0.4, 0.65], [0, 1]);
    const ctaY       = useTransform(scrollYProgress, [0.4, 0.65], [50, 0]);

    // Notes chips
    const notesOpacity = useTransform(scrollYProgress, [0.5, 0.75], [0, 1]);
    const notesY       = useTransform(scrollYProgress, [0.5, 0.75], [50, 0]);

    // Badge fades in from 0.2
    const badgeOpacity = useTransform(scrollYProgress, [0.15, 0.4], [0, 1]);
    const badgeY       = useTransform(scrollYProgress, [0.15, 0.4], [50, 0]);

    // Section reveal — triggers once when the 300vh scroll runway enters viewport
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHeroVisible(true);
                    obs.unobserve(el);
                }
            },
            { threshold: 0.05 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    // ── GSAP multi-layer parallax ─────────────────────────────────────────────
    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);
        if (!containerRef.current) return;

        const ctx = gsap.context(() => {
            const trigger = {
                trigger:  containerRef.current,
                start:    "top top",
                end:      "bottom bottom",
                scrub:    1.8,  // smooth lag for cinematic feel
            };

            // Layer 1 — background gradient: drifts DOWN at 0.1x (recedes into scene)
            if (bgLayerRef.current) {
                gsap.fromTo(bgLayerRef.current,
                    { y: 0 },
                    { y: 40, ease: "none", scrollTrigger: trigger }
                );
            }

            // Layer 2 — bottle / canvas: moves UP at 0.3x (floats toward viewer)
            if (bottleLayerRef.current) {
                gsap.fromTo(bottleLayerRef.current,
                    { y: 0 },
                    { y: -80, ease: "none", scrollTrigger: trigger }
                );
            }

            // Layer 3 — headline text: moves UP fastest at 0.5x (foreground depth)
            if (headlineLayerRef.current) {
                gsap.fromTo(headlineLayerRef.current,
                    { y: 0 },
                    { y: -160, ease: "none", scrollTrigger: trigger }
                );
            }
        }, containerRef);

        return () => ctx.revert();
    }, []);

    // Canvas sizing
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const dpr = window.devicePixelRatio || 1;
            canvas.width  = window.innerWidth  * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width  = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            // Redraw current frame after resize
            const img = imagesRef.current[currentFrameRef.current];
            if (img && loadedRef.current[currentFrameRef.current]) {
                const ctx = canvas.getContext("2d");
                if (ctx) drawImageCover(ctx, img, canvas);
            }
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    // Pre-load all frames
    useEffect(() => {
        const urls = buildFrameUrls();
        const imgs: HTMLImageElement[] = urls.map((src, i) => {
            const img = new window.Image();
            img.src = src;
            img.onload = () => {
                loadedRef.current[i] = true;
                // Paint frame 0 as soon as it arrives
                if (i === 0 && canvasRef.current) {
                    const ctx = canvasRef.current.getContext("2d");
                    if (ctx) drawImageCover(ctx, img, canvasRef.current);
                }
            };
            return img;
        });
        imagesRef.current = imgs;
    }, []);

    // Paint the right frame on scroll
    useMotionValueEvent(frameIndex, "change", (latest) => {
        const idx = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(latest)));
        currentFrameRef.current = idx;
        const canvas = canvasRef.current;
        const img = imagesRef.current[idx];
        if (!canvas || !img || !loadedRef.current[idx]) return;
        const ctx = canvas.getContext("2d");
        if (ctx) drawImageCover(ctx, img, canvas);
    });

    return (
        // Outer container — 300vh gives enough scroll runway to animate all 240 frames
        <div
            ref={containerRef}
            id="hero-arabic"
            className="relative h-[300vh] w-full"
        >
            {/* Sticky viewport — stays fixed while parent scrolls */}
            <div
                className={`sticky top-0 h-screen w-full overflow-hidden bg-[#0A0806] reveal-fade${heroVisible ? " is-visible" : ""}`}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
            >

                {/* ── Layer 0: Background video ─────────────────────────────── */}
                {/* autoPlay + loop + muted + playsInline = required for mobile autoplay */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
                    style={{ zIndex: 0 }}
                >
                    <source src="/velour-hero.mp4" type="video/mp4" />
                </video>

                {/* ── Parallax Layer 1 (0.1x): ambient background gradient ── */}
                {/* Gold spotlight — illuminates the bottle from above center   */}
                <div
                    ref={bgLayerRef}
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        zIndex: 1,
                        background: [
                            "radial-gradient(ellipse 65% 55% at 50% 55%, rgba(212,175,55,0.22) 0%, transparent 65%)",
                            "radial-gradient(ellipse 100% 40% at 50% 100%, rgba(10,8,6,0.9) 0%, transparent 60%)",
                        ].join(", "),
                    }}
                />

                {/* ── Parallax Layer 2 (0.3x): canvas / bottle ───────────── */}
                {/* mix-blend-mode: multiply dissolves the white canvas bg     */}
                {/* against the dark stage, leaving only the bottle visible    */}
                <div ref={bottleLayerRef} className="absolute inset-0" style={{ zIndex: 2 }}>
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{
                            transform: "scale(1.08)",
                            display: "block",
                            mixBlendMode: "multiply",
                            imageRendering: "auto",
                        }}
                    />
                </div>

                {/* Floating gold particles overlay */}
                <div style={{ zIndex: 3, position: "relative" }}>
                    <ParticleBackground />
                </div>

                {/* Dark vignette — frames the stage edges */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        zIndex: 4,
                        boxShadow: "inset 0 0 160px rgba(10,8,6,0.85)",
                    }}
                />

                {/* Decorative corner ornament — top right */}
                <div className="absolute top-8 right-8 w-16 h-16 opacity-30 pointer-events-none" style={{ zIndex: 10 }}>
                    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
                        <path d="M80 0 Q40 0 0 40 Q0 20 20 0Z" fill="#D4AF37" />
                        <circle cx="68" cy="12" r="3" fill="#D4AF37" />
                    </svg>
                </div>
                {/* Decorative corner ornament — bottom left */}
                <div className="absolute bottom-8 left-8 w-16 h-16 opacity-30 rotate-180 pointer-events-none" style={{ zIndex: 10 }}>
                    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
                        <path d="M80 0 Q40 0 0 40 Q0 20 20 0Z" fill="#D4AF37" />
                        <circle cx="68" cy="12" r="3" fill="#D4AF37" />
                    </svg>
                </div>

                {/* OVERLAY: brand badge — fades in early */}
                <motion.div
                    style={{ opacity: badgeOpacity, y: badgeY, zIndex: 10 }}
                    className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-none"
                >
                    <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#D4AF37]" />
                    <span className="text-[#D4AF37] text-xs tracking-[0.45em] font-light uppercase drop-shadow-sm">
                        E D M A
                    </span>
                    <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#D4AF37]" />
                </motion.div>

                {/* ── Parallax Layer 3 (0.5x): headline wrapper ───────────── */}
                {/* Moves UP fastest — text appears to float in front of the bottle */}
                <div ref={headlineLayerRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                    {/* OVERLAY: main text block — right side */}
                    <motion.div
                        style={{ opacity: overlayOpacity, y: overlayY }}
                        className="absolute inset-0 flex items-center justify-end"
                    >
                        <div className="w-full max-w-xs md:max-w-sm px-8 md:px-12 flex flex-col items-start gap-4 pointer-events-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            {/* Brand name */}
                            <ScrambleTitle
                                align={language === 'ar' ? "right" : "left"}
                                className={language === 'ar' ? "font-arabic text-6xl md:text-8xl font-light text-[#EBE5D9] leading-none drop-shadow-lg" : "font-serif text-6xl md:text-8xl font-light text-[#EBE5D9] leading-none drop-shadow-lg"}
                            />

                            {/* Gold divider */}
                            <div className={language === 'ar' ? "w-16 h-px bg-gradient-to-r from-[#D4AF37] to-transparent" : "w-16 h-px bg-gradient-to-l from-[#D4AF37] to-transparent"} />

                            {/* Tagline */}
                            <p className={language === 'ar' ? "font-arabic text-base md:text-lg text-[#EBE5D9]/75 leading-relaxed font-light" : "font-sans text-base md:text-lg text-[#EBE5D9]/75 leading-relaxed font-light"}>
                                {t.tagline1[language]}
                                <br />
                                {t.tagline2[language]}
                                <br />
                                {t.tagline3[language]}
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* OVERLAY: fragrance notes — bottom center */}
                <motion.div
                    style={{ opacity: notesOpacity, y: notesY, zIndex: 10 }}
                    className="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 pointer-events-none w-full"
                >
                    {t.notes[language].map((note) => (
                        <span
                            key={note}
                            className={language === 'ar' ? "font-arabic text-xs text-[#D4AF37]/80 border border-[#D4AF37]/40 px-4 py-1.5 rounded-full bg-[#D4AF37]/8 backdrop-blur-sm tracking-wide" : "font-sans text-[10px] md:text-xs text-[#D4AF37]/80 border border-[#D4AF37]/40 px-4 py-1.5 rounded-full bg-[#D4AF37]/8 backdrop-blur-sm tracking-widest uppercase font-medium"}
                        >
                            {note}
                        </span>
                    ))}
                </motion.div>

                {/* OVERLAY: CTA button — bottom left */}
                <motion.div
                    style={{ opacity: ctaOpacity, y: ctaY, zIndex: 10 }}
                    className="absolute bottom-14 left-8 md:left-16"
                >
                    <Link
                        href="/shop"
                        id="hero-shop-btn"
                        className="group relative overflow-hidden block rounded-full transition-all duration-700 ease-out hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(212,175,55,0.4)]"
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-[#C9A227] via-[#E5C84A] to-[#C9A227] rounded-full transition-opacity duration-700 ease-out group-hover:opacity-90" />
                        <span className="absolute inset-0 bg-gradient-to-t from-[#A07C1A]/40 to-transparent rounded-full transition-opacity duration-700 ease-out group-hover:opacity-60" />
                        <span className={language === 'ar' ? "relative flex items-center gap-3 px-8 py-3.5 rounded-full font-arabic text-[#3D2B1F] font-semibold text-sm tracking-wide" : "relative flex items-center gap-3 px-8 py-3.5 rounded-full font-sans text-[#3D2B1F] font-semibold text-xs tracking-widest uppercase"}>
                            {t.shopNow[language]}
                            <svg
                                className={`w-4 h-4 transition-transform duration-300 ${language === 'ar' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d={language === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                            </svg>
                        </span>
                    </Link>

                    <p className={language === 'ar' ? "mt-3 font-arabic text-xs text-[#EBE5D9]/50 tracking-wide text-center" : "mt-3 font-sans text-[10px] text-[#EBE5D9]/50 tracking-widest uppercase text-center"}>
                        {t.details[language]}
                    </p>
                </motion.div>

                {/* Scroll indicator — fades out after first 20% of scroll */}
                <motion.div
                    style={{ opacity: useTransform(scrollYProgress, [0, 0.15], [1, 0]), zIndex: 10 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none"
                >
                    <span className={language === 'ar' ? "font-arabic text-[10px] text-[#EBE5D9]/50 tracking-widest" : "font-sans text-[9px] text-[#EBE5D9]/50 tracking-[0.2em] uppercase"}>
                        {t.scroll[language]}
                    </span>
                    <div className="w-px h-8 bg-gradient-to-b from-[#D4AF37]/60 to-transparent animate-pulse" />
                </motion.div>

            </div>
        </div>
    );
}
