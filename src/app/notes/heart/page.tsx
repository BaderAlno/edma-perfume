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
const CATEGORIES = {
    floral: [
        { id: "rose", nameEn: "Rose", nameAr: "ورد", descEn: "Timeless, romantic, and deeply elegant.", descAr: "خالد، رومانسي، وعميق الأناقة.", icon: "🌹" },
        { id: "jasmine", nameEn: "Jasmine", nameAr: "ياسمين", descEn: "Sensual, rich, and unmistakably lavish.", descAr: "حسّي، غني، وفاخر بلا منازع.", icon: "🌸" },
    ],
    spicy: [
        { id: "cinnamon", nameEn: "Cinnamon", nameAr: "قرفة", descEn: "Warm, sweet, and comfortingly bold.", descAr: "دافئ، حلو، وجريء بطريقة مريحة.", icon: "🍂" },
        { id: "cardamom", nameEn: "Cardamom", nameAr: "هيل", descEn: "Aromatic, intensely spicy, and deeply grounded.", descAr: "عطري، حار بقوة، وراسخ في الأعماق.", icon: "🌿" },
    ],
};

const USAGE_GUIDE = [
    {
        id: "day",
        titleEn: "Day",
        titleAr: "النهار",
        descEn: "Light, airy florals that bring an aura of approachable elegance.",
        descAr: "زهور خفيفة تضفي هالة من الأناقة المريحة في أوقات النهار.",
        icon: "☀️",
    },
    {
        id: "night",
        titleEn: "Night",
        titleAr: "المساء",
        descEn: "Rich, deeply spiced notes that linger long after sunset.",
        descAr: "نوتات حارة وغنية تترك أثراً طويلاً وساحراً بعد غروب الشمس.",
        icon: "🌙",
    },
    {
        id: "special",
        titleEn: "Special Occasions",
        titleAr: "المناسبات الخاصة",
        descEn: "A dramatic blend of both for an unforgettable, enduring signature.",
        descAr: "مزيج درامي من الزهور والتوابل لتوقيع عطري لا يُنسى.",
        icon: "✨",
    },
];

const UI = {
    badge: { en: "The Soul of the Fragrance", ar: "روح العطر" },
    heading: { en: "Heart Notes", ar: "قلب العطر" },
    quote: { en: "The heart note is the true identity—a lingering whisper of romance and warmth.", ar: "قلب العطر هو الهوية الحقيقية — همسة راسخة من الرومانسية والدفء." },
    intro: {
        en: "After the opening freshness fades, the fragrance reveals its true hidden soul — the Heart Notes. Here emotion is born, where the deepest and richest ingredients blend to create an enchanting aura that lasts long, and truly expresses your identity wherever you go.",
        ar: "بعد أن تتلاشى الانتعاشة الأولى، يكشف العطر عن روحه الخفية الحقيقية؛ 'قلب العطر' (Heart Notes). هنا تولد العاطفة، حيث تمتزج أعمق وأغنى المكونات لتخلق هالة ساحرة تدوم طويلاً، وتعبر بصدق عن هويتك في كل مكان تخطو إليه.",
    },
    floralFamily: { en: "Floral Family", ar: "العائلة الزهرية (Floral)" },
    floralSub: { en: "Delicacy, romance, and blooming elegance.", ar: "الرقة، الرومانسية، والأناقة المتفتحة." },
    spicyFamily: { en: "Spicy Family", ar: "العائلة الحارة (Spicy)" },
    spicySub: { en: "Warmth, mystery, and deep allure.", ar: "الدفء، الغموض، والجاذبية العميقة." },
    whenToWear: { en: "When to wear it?", ar: "متى تتطيب منه؟" },
    productsHeading: { en: "Discover the Heart of EDMA", ar: "اكتشف قلب العطر في إدما" },
    productsSub: { en: "Our fragrance creations feature a rich heart combining the finest flowers and luxurious spices.", ar: "تتميز إبداعاتنا العطرية بقلب غني يجمع بين أجود الزهور والتوابل الفاخرة." },
    bestSeller: { en: "Best Seller", ar: "الأكثر مبيعاً" },
    noProducts: { en: "No fragrances match this category yet.", ar: "لا توجد عطور مطابقة لهذا التصنيف حالياً." },
    ctaHeading: { en: "Discover Your Signature Scent", ar: "اكتشف عطرك المميز" },
    ctaButton: { en: "Explore Collection", ar: "استكشف المجموعة" },
    lowStock: { en: (n: number) => `Limited — only ${n} left!`, ar: (n: number) => `الكمية محدودة - تبقى ${n} فقط!` },
    outOfStock: { en: "Out of Stock", ar: "نفذ المخزون" },
};

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

type Product = Database["public"]["Tables"]["products"]["Row"];

export default function HeartNotesPage() {
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
                const data = await getProductsByNote("heart_notes", ["floral", "spicy", "زهري", "توابل", "ورد", "ياسمين", "rose"]);
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
            className="min-h-screen bg-[#0d0905] text-[#EBE5D9] overflow-hidden selection:bg-[#C9A84C]/30 selection:text-[#EBE5D9]"
            dir={isAr ? "rtl" : "ltr"}
        >
            {/* 1. NARRATIVE SECTION (Intro) */}
            <section className="relative w-full pt-32 pb-24 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(201,168,76,0.1)_0%,_transparent_60%)] pointer-events-none" />

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
                    <div className="w-16 h-px bg-[#C9A84C]/50 my-2" />
                    <p className="text-[#8B7355] text-lg md:text-2xl font-serif italic leading-relaxed font-light">
                        &ldquo;{t(UI.quote)}&rdquo;
                    </p>
                    <p className="text-[#8B7355] text-lg font-sans leading-relaxed max-w-3xl">
                        {t(UI.intro)}
                    </p>
                </motion.div>
            </section>

            {/* 2. INTERACTIVE CATEGORIES */}
            <section className="relative w-full max-w-7xl mx-auto px-6 py-16">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="flex flex-col gap-24"
                >
                    {/* Floral Category */}
                    <div className="flex flex-col gap-8">
                        <motion.div variants={fadeUp} className={`text-center ${isAr ? "md:text-right" : "md:text-left"}`}>
                            <h2 className="text-3xl md:text-4xl font-serif text-[#EBE5D9] mb-2">
                                {t(UI.floralFamily)}
                            </h2>
                            <p className="text-[#8B7355] text-sm md:text-base font-sans">
                                {t(UI.floralSub)}
                            </p>
                        </motion.div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            {CATEGORIES.floral.map((item) => (
                                <motion.div
                                    key={item.id}
                                    variants={fadeUp}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    className="group relative bg-[#120d08] border border-[#C9A84C]/10 rounded-2xl p-8 md:p-12 overflow-hidden transition-all duration-700 hover:border-[#C9A84C]/40 flex items-center gap-8"
                                >
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(201,168,76,0.1)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                    <span className="text-6xl drop-shadow-[0_0_15px_rgba(201,168,76,0.2)] group-hover:scale-110 transition-transform duration-700">
                                        {item.icon}
                                    </span>
                                    <div className="relative z-10">
                                        <h3 className="text-[#EBE5D9] text-2xl font-serif mb-1 group-hover:text-[#C9A84C] transition-colors">
                                            {isAr ? item.nameAr : item.nameEn}
                                        </h3>
                                        <span className="text-[#8B7355] text-xs tracking-widest uppercase font-sans mb-3 block" dir="ltr">
                                            {item.nameEn}
                                        </span>
                                        <p className="text-[#8B7355] text-sm leading-relaxed font-sans">
                                            {isAr ? item.descAr : item.descEn}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Spicy Category */}
                    <div className="flex flex-col gap-8">
                        <motion.div variants={fadeUp} className={`text-center ${isAr ? "md:text-right" : "md:text-left"}`}>
                            <h2 className="text-3xl md:text-4xl font-serif text-[#EBE5D9] mb-2">
                                {t(UI.spicyFamily)}
                            </h2>
                            <p className="text-[#8B7355] text-sm md:text-base font-sans">
                                {t(UI.spicySub)}
                            </p>
                        </motion.div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            {CATEGORIES.spicy.map((item) => (
                                <motion.div
                                    key={item.id}
                                    variants={fadeUp}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    className="group relative bg-[#120d08] border border-[#C9A84C]/10 rounded-2xl p-8 md:p-12 overflow-hidden transition-all duration-700 hover:border-[#C9A84C]/40 flex items-center gap-8"
                                >
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(201,168,76,0.1)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                    <span className="text-6xl drop-shadow-[0_0_15px_rgba(201,168,76,0.2)] group-hover:scale-110 transition-transform duration-700">
                                        {item.icon}
                                    </span>
                                    <div className="relative z-10">
                                        <h3 className="text-[#EBE5D9] text-2xl font-serif mb-1 group-hover:text-[#C9A84C] transition-colors">
                                            {isAr ? item.nameAr : item.nameEn}
                                        </h3>
                                        <span className="text-[#8B7355] text-xs tracking-widest uppercase font-sans mb-3 block" dir="ltr">
                                            {item.nameEn}
                                        </span>
                                        <p className="text-[#8B7355] text-sm leading-relaxed font-sans">
                                            {isAr ? item.descAr : item.descEn}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* 3. USAGE GUIDE */}
            <section className="relative w-full max-w-7xl mx-auto px-6 py-24 md:py-32">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeUp}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-serif text-[#EBE5D9] mb-4">
                        {t(UI.whenToWear)}
                    </h2>
                    <div className="w-20 h-px bg-[#C9A84C]/50 mx-auto" />
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
                >
                    {USAGE_GUIDE.map((guide) => (
                        <motion.div
                            key={guide.id}
                            variants={fadeUp}
                            className="bg-[#120d08]/50 backdrop-blur-sm border border-[#C9A84C]/10 rounded-xl p-8 flex flex-col items-center text-center gap-4 transition-colors hover:bg-[#120d08]"
                        >
                            <span className="text-4xl mb-2">{guide.icon}</span>
                            <h3 className="text-[#EBE5D9] text-xl font-serif">
                                {isAr ? guide.titleAr : guide.titleEn}
                            </h3>
                            <span className="text-[#C9A84C] text-[10px] uppercase tracking-widest font-sans mb-2" dir="ltr">
                                {guide.titleEn}
                            </span>
                            <p className="text-[#8B7355] text-sm leading-relaxed font-sans">
                                {isAr ? guide.descAr : guide.descEn}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* 4. DYNAMIC PRODUCT GRID */}
            <section className="relative w-full bg-[#0a0704] py-24 md:py-32 px-6">
                <div className="absolute inset-x-0 top-0 border-t border-[#C9A84C]/10" />
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="max-w-7xl mx-auto text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-serif text-[#EBE5D9] mb-4">
                        {t(UI.productsHeading)}
                    </h2>
                    <p className="text-[#8B7355] text-sm md:text-base font-sans max-w-2xl mx-auto">
                        {t(UI.productsSub)}
                    </p>
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
                                        <Link href={`/shop#${product.id}`} className="group relative flex flex-col h-full bg-[#120d08] border border-[#C9A84C]/10 rounded-xl overflow-hidden hover:border-[#C9A84C]/30 transition-colors">
                                            <div className="relative aspect-[4/5] bg-[#1A1410] overflow-hidden">
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
                                                        <div className="w-16 h-24 border border-[#C9A84C]/20 rounded-md mb-2" />
                                                        <span className="text-xs uppercase tracking-widest font-sans">Edma</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-6 flex flex-col items-center text-center gap-2 flex-grow">
                                                <h3 className="text-[#EBE5D9] text-xl font-serif">
                                                    {isAr ? (product.name_ar || product.name) : (product.name || product.name_ar)}
                                                </h3>
                                                <span className="text-[#C9A84C] text-lg font-sans tabular-nums mt-auto">
                                                    {formatPrice(Number(product.price_sar || 0))}
                                                </span>
                                                {product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity <= 10 && (
                                                    <div className="flex items-center gap-1.5 mt-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/80 animate-pulse" />
                                                        <span className="text-[10px] font-medium text-red-400 tracking-wider">
                                                            {UI.lowStock[language](product.stock_quantity)}
                                                        </span>
                                                    </div>
                                                )}
                                                {product.stock_quantity === 0 && (
                                                    <div className="flex items-center gap-1.5 mt-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500/60" />
                                                        <span className="text-[10px] font-medium text-[#EBE5D9]/40 tracking-wider">
                                                            {t(UI.outOfStock)}
                                                        </span>
                                                    </div>
                                                )}
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
                    <h2 className="text-4xl md:text-5xl font-serif text-[#EBE5D9] tracking-wide font-light">
                        {t(UI.ctaHeading)}
                    </h2>
                    <Link
                        href="/shop"
                        className="group relative inline-flex items-center justify-center px-10 py-5 rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(201,168,76,0.3)] bg-[#C9A84C]"
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-[#C9A84C] via-[#E5C84A] to-[#C9A84C] opacity-90 group-hover:opacity-100 transition-opacity" />
                        <span className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                        <span className="relative text-[#0d0905] text-sm md:text-base font-semibold uppercase tracking-[0.2em]">
                            {t(UI.ctaButton)}
                        </span>
                    </Link>
                </motion.div>
            </section>
        </main>
    );
}
