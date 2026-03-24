"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export default function StorytellingOverlay() {
    const { scrollYProgress } = useScroll();

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
                className="sticky top-0 h-screen flex flex-col items-center justify-center text-center px-6"
            >
                <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-white/90 tracking-widest text-glow mb-6">
                    ELINOR
                </h1>
                <p className="font-light text-lg md:text-2xl text-[#EBE5D9]/70 tracking-wide max-w-xl">
                    Invisible elegance, unforgettable presence.
                </p>
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
                <div className="max-w-md pointer-events-auto">
                    <h2 className="font-serif text-4xl md:text-5xl text-white/90 mb-6 text-glow">A Gourmand Masterpiece.</h2>
                    <p className="text-[#EBE5D9]/70 font-light leading-relaxed text-lg">
                        A sweet escape into a world of elegance. Rich praline, warm vanilla, and deep patchouli leave a trail that lingers long after you&apos;re gone.
                    </p>
                </div>
            </motion.div>

            {/* 5. Reassembly & CTA */}
            <motion.div
                style={{ opacity: ctaOpacity, y: ctaY }}
                className="sticky top-0 h-screen flex flex-col items-center justify-center text-center px-6"
            >
                <div className="pointer-events-auto max-w-4xl flex flex-col items-center">
                    <h2 className="font-serif text-5xl md:text-7xl text-white/90 mb-6 text-glow tracking-wide">
                        One fragrance.<br className="hidden md:block" /> A thousand stories.
                    </h2>
                    <p className="text-[#EBE5D9]/80 font-light text-xl md:text-2xl mb-12">
                        Elinor Eau de Parfum. Because you deserve to stand out.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <button className="px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#FFBF00] text-[#0A0806] rounded-full font-medium tracking-wide transition-transform hover:scale-105 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                            Experience Elinor
                        </button>
                        <button className="px-8 py-4 border border-white/20 text-white/90 rounded-full font-light tracking-wide transition-colors hover:bg-white/5 hover:border-white/40">
                            View Fragrance Profile
                        </button>
                    </div>
                </div>
            </motion.div>

        </div>
    );
}
