"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface Props {
    videoSrc?:     string;
    audioSrc?:     string;
    scrollHeight?: string;
}

export default function CinematicSection({
    videoSrc     = "/velour-hero.mp4",
    audioSrc     = "/velour-audio.mp3",
    scrollHeight = "400vh",
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef     = useRef<HTMLVideoElement>(null);
    const audioRef     = useRef<HTMLAudioElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const { language } = useLanguage();
    const isAr = language === "ar";

    const [isReady,     setIsReady]     = useState(false);
    const [isPlaying,   setIsPlaying]   = useState(false);

    // Framer-motion scroll progress for label reveal + entry/exit fades
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });
    const labelOpacity   = useTransform(scrollYProgress, [0.15, 0.35], [0, 1]);
    const labelY         = useTransform(scrollYProgress, [0.15, 0.35], [20, 0]);
    const overlayOpacity = useTransform(scrollYProgress, [0, 0.08, 0.92, 1], [1, 0, 0, 1]);

    // GSAP: scrub video currentTime with scroll — no audio automation here
    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const video     = videoRef.current;
        const container = containerRef.current;
        if (!video || !container) return;

        let ctx: ReturnType<typeof gsap.context> | null = null;

        function setupScrub() {
            if (!video || !container) return;
            const duration = video!.duration;
            if (!duration || isNaN(duration)) return;

            setIsReady(true);
            video!.pause();

            ctx = gsap.context(() => {
                ScrollTrigger.create({
                    trigger:  container,
                    start:    "top top",
                    end:      "+=400%",
                    scrub:    1.5,
                    onUpdate: (self) => {
                        video!.currentTime = self.progress * duration;
                        if (progressBarRef.current) {
                            progressBarRef.current.style.width = `${self.progress * 100}%`;
                        }
                    },
                });
            });
        }

        if (video.readyState >= 1) {
            setupScrub();
        } else {
            video.addEventListener("loadedmetadata", setupScrub, { once: true });
        }

        return () => ctx?.revert();
    }, []);

    // User-initiated audio toggle — the only way audio starts (satisfies autoplay policy)
    function toggleSound() {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play().catch(() => {/* blocked — no-op */});
            setIsPlaying(true);
        }
    }

    return (
        <div
            ref={containerRef}
            className="relative w-full"
            style={{ height: scrollHeight }}
        >
            {/* Independent audio track — never plays automatically */}
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio ref={audioRef} src={audioSrc} loop preload="metadata" />

            {/* ── Sticky viewport ──────────────────────────────────────────── */}
            <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#0A0806]">

                {/* Entry / exit fade overlay */}
                <motion.div
                    style={{ opacity: overlayOpacity }}
                    className="absolute inset-0 bg-[#0A0806] z-20 pointer-events-none"
                />

                {/* ── Video (scroll-scrubbed, always muted) ─────────────── */}
                <video
                    ref={videoRef}
                    src={videoSrc}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                />

                {/* Cinematic letterbox bars */}
                <div className="absolute inset-x-0 top-0 h-[8vh] bg-gradient-to-b from-[#0A0806] to-transparent pointer-events-none z-10" />
                <div className="absolute inset-x-0 bottom-0 h-[12vh] bg-gradient-to-t from-[#0A0806] to-transparent pointer-events-none z-10" />

                {/* Vignette */}
                <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(10,8,6,0.6)] pointer-events-none z-10" />

                {/* ── Section label ─────────────────────────────────────────── */}
                <motion.div
                    style={{ opacity: labelOpacity, y: labelY }}
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20 pointer-events-none"
                >
                    <p className={`${isAr ? "font-arabic text-sm" : "font-sans text-[10px] uppercase tracking-[0.45em]"} text-[#C9A84C]/65`}>
                        {isAr ? "العطر في الحركة" : "Fragrance in motion"}
                    </p>
                    <div className="w-px h-7 bg-gradient-to-b from-[#C9A84C]/50 to-transparent" />
                </motion.div>

                {/* ── Sound toggle button ───────────────────────────────────── */}
                <button
                    onClick={toggleSound}
                    className="absolute bottom-8 right-6 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C9A84C]/40 bg-black/40 backdrop-blur-sm text-[#C9A84C] hover:bg-black/60 transition-colors"
                    aria-label={isPlaying ? "Mute audio" : "Play audio"}
                >
                    {isPlaying ? (
                        <>
                            {/* Speaker with sound waves */}
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            </svg>
                            <span className="text-[10px] uppercase tracking-widest">Sound: ON</span>
                        </>
                    ) : (
                        <>
                            {/* Muted speaker */}
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            </svg>
                            <span className="text-[10px] uppercase tracking-widest">Sound: OFF</span>
                        </>
                    )}
                </button>

                {/* ── Scroll-progress bar ───────────────────────────────────── */}
                {isReady && (
                    <div className="absolute bottom-0 inset-x-0 h-px bg-[#C9A84C]/10 z-20">
                        <div
                            ref={progressBarRef}
                            className="h-full bg-gradient-to-r from-[#C9A84C]/60 to-[#E5C84A]/80"
                            style={{ width: "0%" }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
