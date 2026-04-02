"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { getProductsByNote } from "@/lib/api/products";
import type { Database } from "@/lib/database.types";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";

// ─── Constants & Content ─────────────────────────────────────────────────────
const INGREDIENTS = [
    { id: "oud", nameEn: "Oud", nameAr: "عود", descEn: "Deep, woody, and intensely rich.", descAr: "عميق، خشبي، وغني بكثافة.", icon: "🪵" },
    { id: "musk", nameEn: "Musk", nameAr: "مسك", descEn: "Sensual, earthy, and warmly enveloping.", descAr: "حسّي، ترابي، ودافئ في أعماقه.", icon: "🌌" },
    { id: "vanilla", nameEn: "Vanilla", nameAr: "فانيلا", descEn: "Sweet, comforting, and deeply alluring.", descAr: "حلو، مريح، وجذاب في أعماقه.", icon: "🍦" },
    { id: "woods", nameEn: "Woods", nameAr: "أخشاب", descEn: "Dry, sophisticated, and incredibly grounding.", descAr: "جاف، راقٍ، وراسخ بشكل لافت.", icon: "🌲" },
];

const TRUST_BADGES = [
    {
        titleEn: "Long-Lasting",
        titleAr: "ثبات طويل الأمد",
        icon: "⏳",
        descEn: "Formulated to linger from dawn until dusk.",
        descAr: "مُصاغ ليبقى من الفجر حتى الغروب.",
    },
    {
        titleEn: "High Concentration",
        titleAr: "تركيز عالي",
        icon: "💧",
        descEn: "Extrait de Parfum level concentrations.",
        descAr: "تركيزات على مستوى مستخلص العطر.",
    },
    {
        titleEn: "Premium Oils",
        titleAr: "زيوت فاخرة",
        icon: "✨",
        descEn: "Sourced from the world's most prestigious distillers.",
        descAr: "مستخلصة من أرقى مقطّري العالم.",
    },
];

const REVIEWS = [
    { id: 1, name: "Sarah Al-Rashid", rating: 5, text: "The base notes genuinely last for days on my clothes. The oud and musk dry-down is incredibly sophisticated and leaves a stunning trail everywhere I go." },
    { id: 2, name: "Faisal K.", rating: 5, text: "I have never received so many compliments hours after applying a perfume. The vanilla and wood combination is pure luxury." },
    { id: 3, name: "Noura M.", rating: 5, text: "What I love most is how the fragrance evolves. The opening is fresh, but the base notes are where the true magic and warmth happen." },
];

const UI = {
    badge: { en: "The Enduring Foundation", ar: "الأساس الراسخ" },
    heading: { en: "Base Notes", ar: "القاعدة العطرية" },
    quote: { en: "The base note is the memory that lingers—a profound depth that stands the test of time.", ar: "القاعدة العطرية هي الذاكرة الراسخة — عمق عميق يتحدى الزمن." },
    intro: {
        en: "Base Notes are the deep and solid foundation upon which the fragrance rests. Made of heavy molecules that evaporate very slowly, they last on your skin for hours and even days — the strongest and most enduring olfactory memory that leaves an unforgettable impression.",
        ar: "القاعدة العطرية (Base Notes) هي الأساس العميق والصلب الذي يرتكز عليه العطر. تتكون من جزيئات ثقيلة تتبخر ببطء شديد، لتدوم على بشرتك لساعات طويلة وحتى لأيام. إنها الذاكرة العطرية الأقوى والأكثر رسوخاً التي تترك انطباعاً لا يُنسى.",
    },
    whyLastHeading: { en: "Why do our perfumes last longer?", ar: "لماذا تدوم عطورنا طويلاً؟" },
    whyLastText: {
        en: "We never compromise on quality. Our high concentration of pure aromatic oils and heavy woody base notes ensures exceptional longevity that defies time, keeping your fragrance alive and vibrant in the fabric of your clothes and the memory of those around you.",
        ar: "نحن لا نساوم على الجودة. تركيزنا العالي من الزيوت العطرية النقية والقواعد الخشبية والحيوانية الثقيلة يضمن لك ثباتاً استثنائياً يتحدى الزمن، ليرافقك عطرك ويبقى نابضاً بالحياة في نسيج ملابسك وذاكرة من حولك.",
    },
    reviewsHeading: { en: "What our customers say", ar: "ماذا يقول عملاؤنا" },
    topPerfumesLabel: { en: "Exceptional Longevity", ar: "ثبات استثنائي" },
    topPerfumesHeading: { en: "Top Long-Lasting Perfumes", ar: "أفضل العطور ثباتاً" },
    bestSeller: { en: "Best Seller", ar: "الأكثر مبيعاً" },
    longLasting: { en: "Long-Lasting", ar: "ثبات طويل" },
    noProducts: { en: "No fragrances match this category yet.", ar: "لا توجد عطور مطابقة لهذا التصنيف حالياً." },
    ctaHeading: { en: "Experience Fragrances That Stand the Test of Time", ar: "اكتشف عطوراً تتحدى الزمن" },
    ctaButton: { en: "Shop Long-Lasting Perfumes", ar: "تسوق العطور الثابتة" },
    lowStock: { en: (n: number) => `Limited — only ${n} left!`, ar: (n: number) => `الكمية محدودة - تبقى ${n} فقط!` },
    outOfStock: { en: "Out of Stock", ar: "نفذ المخزون" },
};

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: "easeOut" } },
};

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

type Product = Database["public"]["Tables"]["products"]["Row"];

export default function BaseNotesPage() {
    const { language } = useLanguage();
    const { formatPrice } = useCurrency();
    const isAr = language === "ar";
    const t = (obj: { en: string; ar: string }) => obj[language];

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            try {
                const data = await getProductsByNote("base_notes", ["oud", "musk", "vanilla", "wood", "عود", "مسك", "فانيلا", "أخشاب", "خشب"]);
                if (!data || data.length === 0) {
                    const { createBrowserClient } = await import("@supabase/ssr");
                    const supabase = createBrowserClient<Database>(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                    );
                    const { data: all } = await supabase.from("products").select("*").eq("is_active", true).limit(8);
                    setProducts(all || []);
                } else {
                    setProducts(data);
                }
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, []);

    return (
        <main
            className="min-h-screen bg-[#080604] text-[#EBE5D9] overflow-hidden selection:bg-[#C9A84C]/30 selection:text-[#EBE5D9]"
            dir={isAr ? "rtl" : "ltr"}
        >
            {/* 1. NARRATIVE SECTION */}
            <section className="relative w-full pt-32 pb-24 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(201,168,76,0.08)_0%,_rgba(8,6,4,1)_70%)] pointer-events-none" />

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="relative z-10 max-w-4xl flex flex-col items-center gap-6"
                >
                    <span className="text-[#C9A84C] text-sm uppercase tracking-[0.3em] font-sans">
                        {t(UI.badge)}
                    </span>
                    <h1 className="text-5xl md:text-7xl font-serif text-[#EBE5D9] font-light">
                        {t(UI.heading)}
                    </h1>
                    <div className="w-20 h-px bg-[#C9A84C]/50 my-2" />
                    <p className="text-[#8B7355] text-lg md:text-2xl font-serif italic leading-relaxed font-light">
                        &ldquo;{t(UI.quote)}&rdquo;
                    </p>
                    <p className="text-[#8B7355] text-lg font-sans leading-relaxed max-w-3xl">
                        {t(UI.intro)}
                    </p>
                </motion.div>
            </section>

            {/* 2. INGREDIENT HIGHLIGHTS */}
            <section className="relative w-full max-w-7xl mx-auto px-6 py-16">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {INGREDIENTS.map((item) => (
                        <motion.div
                            key={item.id}
                            variants={fadeUp}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group relative bg-[#0b0805] border border-[#C9A84C]/15 rounded-2xl p-8 overflow-hidden transition-all duration-700 hover:border-[#C9A84C]/50 hover:shadow-[0_20px_40px_rgba(201,168,76,0.05)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(201,168,76,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            <div className="relative z-10 flex flex-col items-center text-center gap-4">
                                <span className="text-5xl drop-shadow-[0_0_20px_rgba(201,168,76,0.2)] group-hover:scale-110 transition-transform duration-700">
                                    {item.icon}
                                </span>
                                <div>
                                    <h3 className="text-[#EBE5D9] text-2xl font-serif mb-1 group-hover:text-[#C9A84C] transition-colors">
                                        {isAr ? item.nameAr : item.nameEn}
                                    </h3>
                                    <span className="text-[#8B7355] text-xs tracking-widest uppercase font-sans" dir="ltr">
                                        {item.nameEn}
                                    </span>
                                </div>
                                <p className="text-[#8B7355] text-sm leading-relaxed font-sans mt-2">
                                    {isAr ? item.descAr : item.descEn}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* 3. TRUST BADGES */}
            <section className="relative w-full bg-[#0d0905] py-24 md:py-32 px-6 border-y border-[#C9A84C]/10">
                <div className="max-w-7xl mx-auto flex flex-col gap-20">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeUp}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <h2 className="text-3xl md:text-5xl font-serif text-[#EBE5D9] mb-6">
                            {t(UI.whyLastHeading)}
                        </h2>
                        <p className="text-[#8B7355] text-lg font-sans leading-relaxed">
                            {t(UI.whyLastText)}
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        {TRUST_BADGES.map((badge, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeUp}
                                className="flex flex-col items-center text-center gap-4 bg-[#0a0704] border border-[#C9A84C]/10 rounded-xl p-8"
                            >
                                <span className="text-4xl">{badge.icon}</span>
                                <h3 className="text-[#EBE5D9] text-xl font-serif">
                                    {isAr ? badge.titleAr : badge.titleEn}
                                </h3>
                                <span className="text-[#C9A84C] text-[10px] uppercase tracking-widest font-sans" dir="ltr">
                                    {badge.titleEn}
                                </span>
                                <p className="text-[#8B7355] text-sm font-sans">
                                    {isAr ? badge.descAr : badge.descEn}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* 4. REVIEWS SECTION */}
            <section className="relative w-full max-w-7xl mx-auto px-6 py-24">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeUp}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-serif text-[#EBE5D9] mb-4">
                        {t(UI.reviewsHeading)}
                    </h2>
                    <div className="w-20 h-px bg-[#C9A84C]/50 mx-auto" />
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {REVIEWS.map((review) => (
                        <motion.div
                            key={review.id}
                            variants={fadeUp}
                            className="bg-[#120d08] border border-[#C9A84C]/10 rounded-xl p-8 flex flex-col gap-6 relative"
                        >
                            <div className="text-4xl text-[#C9A84C]/20 absolute top-4 left-6 font-serif">&ldquo;</div>
                            <div className="flex text-[#C9A84C] text-sm justify-end gap-1">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                    <span key={i}>★</span>
                                ))}
                            </div>
                            <p className="text-[#8B7355] text-base leading-relaxed font-sans italic relative z-10" dir="ltr">
                                {review.text}
                            </p>
                            <div className="mt-auto border-t border-[#C9A84C]/10 pt-4 flex items-center justify-end">
                                <span className="text-[#EBE5D9] font-serif tracking-wide text-sm" dir="ltr">
                                    — {review.name}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* 5. TOP LONG-LASTING PERFUMES */}
            <section className="relative w-full bg-[#0d0905] py-24 md:py-32 px-6 border-t border-[#C9A84C]/10">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="max-w-7xl mx-auto text-center mb-16 flex flex-col items-center gap-4"
                >
                    <span className="text-[#C9A84C] text-sm uppercase tracking-[0.2em] font-sans">
                        {t(UI.topPerfumesLabel)}
                    </span>
                    <h2 className="text-3xl md:text-5xl font-serif text-[#EBE5D9]">
                        {t(UI.topPerfumesHeading)}
                    </h2>
                </motion.div>

                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                className="w-10 h-10 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full"
                            />
                        </div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={staggerContainer}
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
                        >
                            {products.length > 0 ? (
                                products.map((product, idx) => (
                                    <motion.div key={product.id} variants={fadeUp}>
                                        <Link href={`/shop#${product.id}`} className="group relative flex flex-col h-full bg-[#0a0704] border border-[#C9A84C]/10 rounded-xl overflow-hidden hover:border-[#C9A84C]/40 transition-colors shadow-lg">
                                            <div className="relative aspect-[4/5] bg-[#120d08] overflow-hidden">
                                                {idx < 2 && (
                                                    <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-[#D4AF37] to-[#C9A84C] text-[#0A0806] text-[10px] font-bold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)] z-10 pointer-events-none">
                                                        {t(UI.bestSeller)}
                                                    </div>
                                                )}
                                                {product.image_url ? (
                                                    <Image
                                                        src={product.image_url}
                                                        alt={product.name_ar || product.name || "Product"}
                                                        fill
                                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-[#8B7355]">
                                                        <div className="w-16 h-24 border border-[#C9A84C]/20 rounded-md mb-2 bg-[#0d0905]" />
                                                        <span className="text-xs uppercase tracking-widest font-sans">Edma</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-3 right-3 bg-[#C9A84C] text-[#0d0905] text-[10px] font-bold px-2 py-1 rounded tracking-wider shadow-md">
                                                    {t(UI.longLasting)}
                                                </div>
                                            </div>
                                            <div className="p-6 flex flex-col items-center text-center gap-2 flex-grow">
                                                <h3 className="text-[#EBE5D9] text-xl font-serif">
                                                    {isAr ? (product.name_ar || product.name) : (product.name || product.name_ar)}
                                                </h3>
                                                <span className="text-[#C9A84C] text-lg font-sans tabular-nums mt-auto">
                                                    {formatPrice(Number(product.price_sar || 0))}
                                                </span>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center text-[#8B7355]">
                                    {t(UI.noProducts)}
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </section>

            {/* 6. CTA SECTION */}
            <section className="relative w-full py-32 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(201,168,76,0.15)_0%,_transparent_60%)] pointer-events-none" />
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="relative z-10 flex flex-col items-center gap-10"
                >
                    <h2 className="text-4xl md:text-5xl font-serif text-[#EBE5D9] tracking-wide font-light max-w-3xl leading-tight">
                        {t(UI.ctaHeading)}
                    </h2>
                    <Link
                        href="/shop"
                        className="group relative inline-flex items-center justify-center px-10 py-5 rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(201,168,76,0.4)] bg-[#C9A84C]"
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-[#C9A84C] via-[#E5C84A] to-[#C9A84C] opacity-90 group-hover:opacity-100 transition-opacity" />
                        <span className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                        <span className="relative text-[#0d0905] text-sm md:text-base font-bold uppercase tracking-[0.2em]">
                            {t(UI.ctaButton)}
                        </span>
                    </Link>
                </motion.div>
            </section>
        </main>
    );
}
