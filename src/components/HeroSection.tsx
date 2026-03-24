"use client";

import { useEffect, useRef } from "react";
import { useScroll, useTransform, useMotionValueEvent, motion } from "framer-motion";

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

    // Cream background to match hero section
    ctx.fillStyle = "#F5EFE4";
    ctx.fillRect(0, 0, cW, cH);

    // Soft warm radial vignette
    const grad = ctx.createRadialGradient(cW / 2, cH / 2, 0, cW / 2, cH / 2, Math.max(cW, cH) * 0.65);
    grad.addColorStop(0, "rgba(245,239,228,0)");
    grad.addColorStop(1, "rgba(245,239,228,0.55)");

    ctx.drawImage(img, oX, oY, dW, dH);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cW, cH);
}

export default function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const loadedRef = useRef<boolean[]>(new Array(TOTAL_FRAMES).fill(false));
    const currentFrameRef = useRef(0);

    // Scroll progress relative only to THIS hero section container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Map scroll 0→1 to frame 0→239
    const frameIndex = useTransform(scrollYProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

    // Overlay text opacity: fades in from scroll 35% → 55%, stays until end
    const overlayOpacity = useTransform(scrollYProgress, [0.3, 0.55], [0, 1]);
    // CTA button fades in a little later
    const ctaOpacity = useTransform(scrollYProgress, [0.5, 0.7], [0, 1]);
    // Notes chips
    const notesOpacity = useTransform(scrollYProgress, [0.55, 0.75], [0, 1]);
    // Badge fades in from 0.2
    const badgeOpacity = useTransform(scrollYProgress, [0.15, 0.35], [0, 1]);

    // Canvas sizing
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
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

    const fragNotes = ["عود فاخر", "ورد طائفي", "مسك أبيض", "عنبر"];

    return (
        // Outer container — 300vh gives enough scroll runway to animate all 240 frames
        <div
            ref={containerRef}
            id="hero-arabic"
            className="relative h-[300vh] w-full"
        >
            {/* Sticky viewport — stays fixed while parent scrolls */}
            <div className="sticky top-0 h-screen w-full overflow-hidden" dir="rtl">

                {/* Canvas — full-screen scroll-sequence */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    style={{ display: "block" }}
                />

                {/* Subtle cream vignette edges to blend canvas into page */}
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(245,239,228,0.7)]" />

                {/* Decorative corner ornament — top right */}
                <div className="absolute top-8 right-8 w-16 h-16 opacity-25 pointer-events-none">
                    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
                        <path d="M80 0 Q40 0 0 40 Q0 20 20 0Z" fill="#D4AF37" />
                        <circle cx="68" cy="12" r="3" fill="#D4AF37" />
                    </svg>
                </div>
                {/* Decorative corner ornament — bottom left */}
                <div className="absolute bottom-8 left-8 w-16 h-16 opacity-25 rotate-180 pointer-events-none">
                    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
                        <path d="M80 0 Q40 0 0 40 Q0 20 20 0Z" fill="#D4AF37" />
                        <circle cx="68" cy="12" r="3" fill="#D4AF37" />
                    </svg>
                </div>

                {/* OVERLAY: brand badge — fades in early */}
                <motion.div
                    style={{ opacity: badgeOpacity }}
                    className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-none"
                >
                    <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#D4AF37]" />
                    <span className="text-[#D4AF37] text-xs tracking-[0.45em] font-light uppercase drop-shadow-sm">
                        E D M A
                    </span>
                    <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#D4AF37]" />
                </motion.div>

                {/* OVERLAY: main text block — right side */}
                <motion.div
                    style={{ opacity: overlayOpacity }}
                    className="absolute inset-0 flex items-center justify-end pointer-events-none"
                >
                    <div className="w-full max-w-xs md:max-w-sm px-8 md:px-12 flex flex-col items-start gap-4">
                        {/* Brand name */}
                        <h1 className="font-arabic text-6xl md:text-8xl font-light text-[#3D2B1F] leading-none drop-shadow-sm">
                            EDMA
                        </h1>

                        {/* Gold divider */}
                        <div className="w-16 h-px bg-gradient-to-r from-[#D4AF37] to-transparent" />

                        {/* Tagline */}
                        <p className="font-arabic text-base md:text-lg text-[#5C4033] leading-relaxed font-light">
                            عودة مثيرة بتجديد ساحر
                            <br />
                            يجسد رونقاً جديداً من
                            <br />
                            الجاذبية والأناقة
                        </p>
                    </div>
                </motion.div>

                {/* OVERLAY: fragrance notes — bottom center */}
                <motion.div
                    style={{ opacity: notesOpacity }}
                    className="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 pointer-events-none"
                >
                    {fragNotes.map((note) => (
                        <span
                            key={note}
                            className="font-arabic text-xs text-[#8B6914] border border-[#D4AF37]/60 px-4 py-1.5 rounded-full bg-[#F5EFE4]/70 backdrop-blur-sm tracking-wide"
                        >
                            {note}
                        </span>
                    ))}
                </motion.div>

                {/* OVERLAY: CTA button — bottom right */}
                <motion.div
                    style={{ opacity: ctaOpacity }}
                    className="absolute bottom-14 left-8 md:left-16"
                >
                    <button
                        id="hero-shop-btn"
                        className="group relative overflow-hidden"
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-[#C9A227] via-[#E5C84A] to-[#C9A227] rounded-full" />
                        <span className="absolute inset-0 bg-gradient-to-t from-[#A07C1A]/40 to-transparent rounded-full" />
                        <span className="relative flex items-center gap-3 px-8 py-3.5 rounded-full font-arabic text-[#3D2B1F] font-semibold text-sm tracking-wide">
                            تسوق الآن
                            <svg
                                className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </span>
                    </button>

                    <p className="mt-3 font-arabic text-xs text-[#8B7355]/70 tracking-wide">
                        ۱۰۰ مل · ماء عطر
                    </p>
                </motion.div>

                {/* Scroll indicator — fades out after first 20% of scroll */}
                <motion.div
                    style={{ opacity: useTransform(scrollYProgress, [0, 0.15], [1, 0]) }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none"
                >
                    <span className="font-arabic text-[10px] text-[#8B7355]/60 tracking-widest">
                        مرر للأسفل
                    </span>
                    <div className="w-px h-8 bg-gradient-to-b from-[#D4AF37]/60 to-transparent animate-pulse" />
                </motion.div>

            </div>
        </div>
    );
}
