"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";
import ScrambleTitle from "@/components/ScrambleTitle";
import ParticleBackground from "@/components/ParticleBackground";

export default function StorytellingOverlay() {
    const { scrollYProgress } = useScroll();
    const { language } = useLanguage();
    const t = translations.storyOverlay;
    const tBtn = translations.productsSection;

    // Opacities mapped to scroll percentages
    // 0-15% (0.0 to 0.15)
    const heroOpacity = useTransform(scrollYProgress, [0, 0.1, 0.15, 0.2], [1, 1, 0, 0]);
    const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -50]);

    // 15-40% (0.15 to 0.4)
    const topNotesOpacity = useTransform(scrollYProgress, [0.15, 0.2, 0.35, 0.4], [0, 1, 1, 0]);
    const topNotesY = useTransform(scrollYProgress, [0.15, 0.2, 0.35, 0.4], [50, 0, 0, -50]);

    // 40-65% (0.4 to 0.65)
    const heartOpacity = useTransform(scrollYProgress, [0.4, 0.45, 0.6, 0.65], [0, 1, 1, 0]);
    const heartY = useTransform(scrollYProgress, [0.4, 0.45, 0.6, 0.65], [50, 0, 0, -50]);

    // 65-85% (0.65 to 0.85)
    const baseOpacity = useTransform(scrollYProgress, [0.65, 0.7, 0.8, 0.85], [0, 1, 1, 0]);
    const baseY = useTransform(scrollYProgress, [0.65, 0.7, 0.8, 0.85], [50, 0, 0, -50]);

    // 85-100% (0.85 to 1.0)
    const ctaOpacity = useTransform(scrollYProgress, [0.85, 0.9, 1], [0, 1, 1]);
    const ctaY = useTransform(scrollYProgress, [0.85, 0.9, 1], [50, 0, 0]);

    return (
        <div className="absolute top-0 left-0 w-full h-[500vh] pointer-events-none">

            {/* 1. Hero / Intro */}
            <motion.div
                style={{ opacity: heroOpacity, y: heroY }}
                className="sticky top-0 h-screen flex flex-col items-center justify-center text-center px-6 pointer-events-auto relative overflow-hidden"
            >
                <ParticleBackground />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="flex flex-col items-center gap-6 md:gap-8"
                >
                    <h1 className="flex items-center justify-center font-serif text-5xl md:text-7xl lg:text-8xl text-white/95 tracking-[0.2em] drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] h-[1.2em]">
                        <ScrambleTitle />
                    </h1>

                    <div className="flex flex-col gap-4 items-center text-center w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <p className={language === 'ar' ? "font-serif text-lg md:text-2xl text-[#EBE5D9]/95 tracking-wide max-w-2xl leading-relaxed drop-shadow-sm" : "font-serif italic text-lg md:text-2xl text-[#EBE5D9]/95 tracking-wide max-w-2xl leading-relaxed drop-shadow-sm"}>
                            {t.quote[language]}
                        </p>
                        <p className={language === 'ar' ? "font-light text-xs md:text-sm text-[#D4AF37]/90 tracking-widest pb-6" : "font-light text-[10px] md:text-xs text-[#D4AF37]/90 tracking-[0.3em] uppercase pb-6"}>
                            {t.subQuote[language]}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <Link
                            href="/shop"
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-[#D4AF37] to-[#FFBF00] text-[#0A0806] rounded-full font-medium tracking-wide transition-all hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                        >
                            {t.shopCollection[language]}
                        </Link>
                        <a
                            href="https://wa.me/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-10 py-4 border border-white/20 text-white/90 rounded-full font-light tracking-wide transition-colors hover:bg-white/10 hover:border-white/40 backdrop-blur-sm"
                        >
                            {tBtn.whatsapp[language]}
                        </a>
                    </div>
                </motion.div>
            </motion.div>

            {/* 2. The Reveal & Top Notes */}
            <motion.div
                style={{ opacity: topNotesOpacity, y: topNotesY }}
                className="sticky top-0 h-screen flex flex-col justify-center items-start px-8 md:px-24 lg:px-40"
            >
                <div className="max-w-md pointer-events-auto">
                    <h2 className="font-serif text-4xl md:text-5xl text-white/90 mb-6 text-glow">The First Impression.</h2>
                    <p className="text-[#EBE5D9]/70 font-light leading-relaxed text-lg">
                        A luminous burst of dewy black currant and fresh pear awakens the senses, setting the stage for an unforgettable journey.
                    </p>
                </div>
            </motion.div>

            {/* 3. The Floral Heart */}
            <motion.div
                style={{ opacity: heartOpacity, y: heartY }}
                className="sticky top-0 h-screen flex flex-col justify-center items-end px-8 md:px-24 lg:px-40 text-right"
            >
                <div className="max-w-md pointer-events-auto">
                    <h2 className="font-serif text-4xl md:text-5xl text-white/90 mb-6 text-glow">The Floral Heart.</h2>
                    <p className="text-[#EBE5D9]/70 font-light leading-relaxed text-lg">
                        A captivating and elegant core. Rare iris, jasmine, and orange blossom blend to create a pulse of pure, vibrant beauty.
                    </p>
                </div>
            </motion.div>

            {/* 4. The Gourmand Base */}
            <motion.div
                style={{ opacity: baseOpacity, y: baseY }}
                className="sticky top-0 h-screen flex flex-col justify-end pb-40 lg:pb-52 items-start px-8 md:px-24 lg:px-40"
            >
                <div className="max-w-md pointer-events-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <h2 className={language === 'ar' ? "font-arabic text-4xl md:text-5xl text-white/90 mb-6 text-glow" : "font-serif text-4xl md:text-5xl text-white/90 mb-6 text-glow"}>{t.gourmand[language]}</h2>
                    <p className="text-[#EBE5D9]/70 font-light leading-relaxed text-lg">
                        {t.gourmandDesc[language]}
                    </p>
                </div>
            </motion.div>

            {/* 5. Reassembly & CTA */}
            <motion.div
                style={{ opacity: ctaOpacity, y: ctaY }}
                className="sticky top-0 h-screen flex flex-col items-center justify-center text-center px-6"
            >
                <div className="pointer-events-auto max-w-4xl flex flex-col items-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <h2 className={language === 'ar' ? "font-arabic text-5xl md:text-7xl text-white/90 mb-6 text-glow tracking-wide" : "font-serif text-5xl md:text-7xl text-white/90 mb-6 text-glow tracking-wide"}>
                        {t.oneFragrance[language]}<br className="hidden md:block" /> {t.thousandStories[language]}
                    </h2>
                    <p className="text-[#EBE5D9]/80 font-light text-xl md:text-2xl mb-12">
                        {t.deserveStandOut[language]}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <Link href="/shop" className="px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#FFBF00] text-[#0A0806] rounded-full font-medium tracking-wide transition-transform hover:scale-105 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                            {t.experienceElinor[language]}
                        </Link>
                        <Link href="/#products" className="px-8 py-4 border border-white/20 text-white/90 rounded-full font-light tracking-wide transition-colors hover:bg-white/5 hover:border-white/40">
                            {t.viewProfile[language]}
                        </Link>
                    </div>
                </div>
            </motion.div>

        </div>
    );
}
