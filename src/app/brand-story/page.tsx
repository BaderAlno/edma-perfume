"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

// ─── Bilingual Content ───────────────────────────────────────────────────────
const content = {
    hero: {
        tagline: { en: "A LEGACY OF ELEGANCE", ar: "إرث من الأناقة" },
        heading: { en: "The Edma Story", ar: "حكاية إدما" },
        subheading: {
            en: "Where artistry meets the essence of nature, crafted for those who leave a memorable presence.",
            ar: "حيث يلتقي الفن بجوهر الطبيعة، صُنع لمن يترك حضوراً لا يُنسى.",
        },
    },
    scrollDiscover: { en: "Scroll to discover", ar: "مرر للاستكشاف" },
    narrative: {
        heading: { en: "Our Beginning", ar: "بدايتنا" },
        text: {
            en: [
                "Born from a passion for rare ingredients and timeless elegance, Edma Perfume began as a vision to encapsulate emotion within a bottle.",
                "Our founders traveled the globe to discover the finest raw materials—from the dew-kissed jasmine of Grasse to the rich oud of the East. Every drop is a testament to meticulous craftsmanship and an uncompromising dedication to luxury.",
            ],
            ar: [
                "وُلدت إدما من شغف بالمكونات النادرة والأناقة الخالدة، انطلاقاً من رؤية تجسّد المشاعر داخل قارورة.",
                "سافر مؤسسونا حول العالم للعثور على أجود المواد الخام — من ياسمين غراس النديّ إلى العود الشرقي الثري. كل قطرة شاهدة على حرفية دقيقة وتفانٍ لا تنازل عنه في سبيل الرفاهية.",
            ],
        },
    },
    philosophy: {
        vision: { en: "Our Vision", ar: "رؤيتنا" },
        heading: { en: "Our Philosophy", ar: "فلسفتنا" },
        text: {
            en: "We believe that a fragrance is more than a scent—it is an invisible signature. It is the lingering memory you leave behind. Our philosophy is rooted in authenticity, creating blends that speak to the soul while respecting the traditions of master perfumery.",
            ar: "نؤمن بأن العطر أكثر من مجرد رائحة — إنه توقيع خفي، والذاكرة العطرة التي تخلّفها وراءك. فلسفتنا متجذّرة في الأصالة، نصنع توليفات تخاطب الروح مع احترام تقاليد فن العطور العريق.",
        },
    },
    highlights: {
        heading: { en: "What Makes Us Different", ar: "ما يميزنا" },
        cards: [
            {
                title: { en: "Rare Ingredients", ar: "مكونات نادرة" },
                description: {
                    en: "Sourced globally, we use only the most precious, ethically harvested raw materials.",
                    ar: "نحصل على مواد خام من حول العالم، ونستخدم فقط أثمنها وأكثرها رفاهية.",
                },
                icon: "✨",
            },
            {
                title: { en: "Master Craftsmanship", ar: "حرفية احترافية" },
                description: {
                    en: "Each fragrance is blended by master perfumers to achieve perfect harmony and longevity.",
                    ar: "تُمزج كل عطر على يد أساتذة العطور لتحقيق انسجام مثالي وثبات استثنائي.",
                },
                icon: "⚗️",
            },
            {
                title: { en: "Timeless Design", ar: "تصميم خالد" },
                description: {
                    en: "Housed in luxuriously heavy glass flacons, our designs reflect the elegance within.",
                    ar: "تُعبّأ في قوارير زجاجية فاخرة وثقيلة تعكس أناقة ما بداخلها.",
                },
                icon: "🏺",
            },
            {
                title: { en: "Sustainable Luxury", ar: "رفاهية مستدامة" },
                description: {
                    en: "We are committed to sustainable practices without ever compromising on quality.",
                    ar: "نلتزم بممارسات مستدامة دون أي تنازل عن الجودة.",
                },
                icon: "🌿",
            },
        ],
    },
    cta: {
        heading: { en: "Ready to find your signature scent?", ar: "هل أنت مستعد لإيجاد عطرك المميز؟" },
        button: { en: "Explore Collection", ar: "استكشف المجموعة" },
    },
};

// ─── Animation Variants ──────────────────────────────────────────────────────
const fadeUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

// ─── Page Component ──────────────────────────────────────────────────────────
export default function BrandStoryPage() {
    const { language } = useLanguage();
    const isAr = language === "ar";
    const t = (obj: { en: string; ar: string }) => obj[language];

    const { scrollY } = useScroll();
    const yHero = useTransform(scrollY, [0, 1000], [0, 300]);
    const opacityHeroText = useTransform(scrollY, [0, 500], [1, 0]);

    return (
        <main
            className="min-h-screen bg-[#0d0905] text-[#EBE5D9] overflow-hidden selection:bg-[#C9A84C]/30 selection:text-[#EBE5D9]"
            dir={isAr ? "rtl" : "ltr"}
        >
            {/* 1. HERO SECTION */}
            <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
                <motion.div className="absolute inset-0 w-full h-full z-0" style={{ y: yHero }}>
                    <div className="absolute inset-0 bg-black/50 z-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0905] via-transparent to-transparent z-10" />
                    <div className="w-full h-full bg-[#1A1410] relative flex items-center justify-center">
                        <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(201,168,76,0.1)_0%,_transparent_60%)] pointer-events-none" />
                    </div>
                </motion.div>

                <motion.div
                    className="relative z-20 text-center px-6 max-w-4xl"
                    style={{ opacity: opacityHeroText }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                >
                    <span className="block text-[#C9A84C] text-xs md:text-sm uppercase tracking-[0.4em] mb-6 font-sans">
                        {t(content.hero.tagline)}
                    </span>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-[#EBE5D9] mb-8 font-light tracking-wide">
                        {t(content.hero.heading)}
                    </h1>
                    <p className="text-[#8B7355] text-lg md:text-xl font-sans max-w-2xl mx-auto leading-relaxed">
                        {t(content.hero.subheading)}
                    </p>
                </motion.div>

                <motion.div
                    className="absolute bottom-12 z-20 flex flex-col items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                >
                    <span className="text-[#8B7355] text-[10px] uppercase tracking-widest font-sans">
                        {t(content.scrollDiscover)}
                    </span>
                    <div className="w-px h-16 bg-gradient-to-b from-[#C9A84C] to-transparent animate-pulse" />
                </motion.div>
            </section>

            {/* 2. NARRATIVE SECTION */}
            <section className="relative w-full max-w-7xl mx-auto px-6 py-24 md:py-40">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeUp}
                        className="relative w-full aspect-[4/5] rounded-tl-full rounded-tr-full overflow-hidden border border-[#C9A84C]/20 p-2"
                    >
                        <div className="w-full h-full rounded-tl-full rounded-tr-full overflow-hidden relative bg-[#1A1410]">
                            <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(201,168,76,0.05)_0%,_transparent_60%)] pointer-events-none" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="flex flex-col gap-8"
                    >
                        <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-serif text-[#EBE5D9] tracking-wide">
                            {t(content.narrative.heading)}
                        </motion.h2>
                        <div className="w-16 h-px bg-[#C9A84C]/50" />
                        <motion.div className="flex flex-col gap-6" variants={staggerContainer}>
                            {content.narrative.text[language].map((paragraph, idx) => (
                                <motion.p key={idx} variants={fadeUp} className="text-[#8B7355] text-lg font-sans leading-relaxed">
                                    {paragraph}
                                </motion.p>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* 3. PHILOSOPHY SECTION */}
            <section className="relative w-full bg-[#0a0704] py-32 px-6">
                <div className="absolute inset-0 border-y border-[#C9A84C]/10" />
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeUp}
                    className="relative z-10 max-w-4xl mx-auto text-center border border-[#C9A84C]/20 p-12 md:p-20 rounded-2xl bg-[#0d0905]/50 backdrop-blur-sm"
                >
                    <span className="block text-[#C9A84C] text-[10px] uppercase tracking-[0.3em] mb-6 font-sans">
                        {t(content.philosophy.vision)}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-serif text-[#EBE5D9] mb-8 tracking-wide">
                        {t(content.philosophy.heading)}
                    </h2>
                    <p className="text-[#8B7355] text-xl md:text-2xl font-serif italic leading-relaxed font-light">
                        &ldquo;{t(content.philosophy.text)}&rdquo;
                    </p>
                </motion.div>
            </section>

            {/* 4. HIGHLIGHTS SECTION */}
            <section className="relative w-full max-w-7xl mx-auto px-6 py-24 md:py-40">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeUp}
                    className="text-center mb-16 md:mb-24"
                >
                    <h2 className="text-4xl md:text-5xl font-serif text-[#EBE5D9] tracking-wide mb-6">
                        {t(content.highlights.heading)}
                    </h2>
                    <div className="w-24 h-px bg-[#C9A84C]/50 mx-auto" />
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
                >
                    {content.highlights.cards.map((card, idx) => (
                        <motion.div
                            key={idx}
                            variants={fadeUp}
                            whileHover={{ y: -10, scale: 1.02, borderColor: "rgba(201, 168, 76, 0.4)" }}
                            className="bg-[#120d08] border border-[#C9A84C]/10 rounded-xl p-8 transition-colors duration-300 group flex flex-col items-center text-center"
                        >
                            <span className="text-4xl mb-6 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                                {card.icon}
                            </span>
                            <h3 className="text-[#EBE5D9] text-xl font-serif mb-4 tracking-wide group-hover:text-[#C9A84C] transition-colors">
                                {t(card.title)}
                            </h3>
                            <p className="text-[#8B7355] text-sm leading-relaxed font-sans">
                                {t(card.description)}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* 5. CTA SECTION */}
            <section className="relative w-full py-32 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(201,168,76,0.1)_0%,_transparent_50%)] pointer-events-none" />
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="relative z-10 flex flex-col items-center gap-10"
                >
                    <h2 className="text-4xl md:text-6xl font-serif text-[#EBE5D9] tracking-wide font-light">
                        {t(content.cta.heading)}
                    </h2>
                    <Link
                        href="/shop"
                        className="group relative inline-flex items-center justify-center px-10 py-5 rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(201,168,76,0.3)] bg-[#C9A84C]"
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-[#C9A84C] via-[#E5C84A] to-[#C9A84C] opacity-90 group-hover:opacity-100 transition-opacity" />
                        <span className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                        <span className="relative text-[#0d0905] text-sm md:text-base font-semibold uppercase tracking-[0.2em]">
                            {t(content.cta.button)}
                        </span>
                    </Link>
                </motion.div>
            </section>
        </main>
    );
}
