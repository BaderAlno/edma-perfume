"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import type { Database } from "@/lib/database.types";
import { getProductsByNote } from "@/lib/api/products";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";

// ─── Constants & Content ─────────────────────────────────────────────────────
const INGREDIENTS = [
    {
        id: "lemon",
        nameEn: "Lemon",
        nameAr: "ليمون",
        descEn: "Zesty, bright, and instantly uplifting.",
        descAr: "منعش، مشرق، ويرفع المعنويات فوراً.",
        icon: "🍋",
    },
    {
        id: "bergamot",
        nameEn: "Bergamot",
        nameAr: "برغموت",
        descEn: "Complex citrus with a slightly spicy, floral edge.",
        descAr: "حمضيات معقدة بلمسة حارة وزهرية خفيفة.",
        icon: "🍊",
    },
    {
        id: "mint",
        nameEn: "Mint",
        nameAr: "نعناع",
        descEn: "Cool, crisp, and intensely refreshing.",
        descAr: "بارد، نقي، ومنعش بقوة.",
        icon: "🌿",
    },
    {
        id: "grapefruit",
        nameEn: "Grapefruit",
        nameAr: "جريب فروت",
        descEn: "Tart and tangy, offering a sharp, vibrant burst.",
        descAr: "لاذع ومنعش، يقدم انفجاراً حاداً ونابضاً بالحياة.",
        icon: "🍈",
    },
];

const UI = {
    badge: { en: "The First Impression", ar: "الانطباع الأول" },
    heading: { en: "Top Notes", ar: "القمة العطرية" },
    intro: {
        en: "Top Notes are the first impression — the very first thing your senses encounter. Made of light molecules that evaporate quickly, they deliver the opening freshness before merging with the heart of the fragrance.",
        ar: "القمة العطرية (Top Notes) هي الانطباع الأول وأول ما تلامسه حواسك. تتكون من جزيئات خفيفة تتبخر بسرعة لتعطيك انتعاشة البداية قبل أن تندمج مع قلب العطر. وهي التي تجذبك في اللحظات الأولى من رش العطر.",
    },
    discoverHeading: { en: "Explore Related Fragrances", ar: "اكتشف العطور المرتبطة" },
    filterActive: { en: "Show All Fragrances", ar: "عرض كل العطور" },
    filterInactive: { en: "I love fresh scents 🍋", ar: "أحب الروائح المنعشة 🍋" },
    filterSubActive: { en: "Showing fragrances with citrus & fresh top notes", ar: "عرض العطور التي تحتوي على حمضيات وانتعاش" },
    filterSubInactive: { en: "Tap to see fragrances that shine with fresh opening notes", ar: "اضغط لرؤية العطور التي تتألق بنوتات افتتاحية منعشة" },
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

export default function TopNotesPage() {
    const { language } = useLanguage();
    const { formatPrice } = useCurrency();
    const isAr = language === "ar";
    const t = (obj: { en: string; ar: string }) => obj[language];

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterActive, setFilterActive] = useState(false);

    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            try {
                let data;
                if (filterActive) {
                    data = await getProductsByNote("top_notes", ["citrus", "fresh", "حمضيات", "منعش"]);
                } else {
                    const { createBrowserClient } = await import("@supabase/ssr");
                    const supabase = createBrowserClient<Database>(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                    );
                    const { data: all } = await supabase.from("products").select("*").eq("is_active", true).limit(8);
                    data = all;
                }
                setProducts(data || []);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, [filterActive]);

    return (
        <main
            className="min-h-screen bg-[#0d0905] text-[#EBE5D9] overflow-hidden selection:bg-[#C9A84C]/30 selection:text-[#EBE5D9]"
            dir={isAr ? "rtl" : "ltr"}
        >
            {/* 1. EDUCATIONAL INTRO SECTION */}
            <section className="relative w-full pt-32 pb-24 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(201,168,76,0.1)_0%,_transparent_60%)] pointer-events-none" />

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="relative z-10 max-w-3xl flex flex-col items-center gap-6"
                >
                    <span className="text-[#C9A84C] text-sm uppercase tracking-[0.3em] font-sans">
                        {t(UI.badge)}
                    </span>
                    <h1 className="text-5xl md:text-7xl font-serif text-[#EBE5D9] font-light">
                        {t(UI.heading)}
                    </h1>
                    <div className="w-16 h-px bg-[#C9A84C]/50 my-2" />
                    <p className="text-[#8B7355] text-lg md:text-xl font-sans leading-relaxed">
                        {t(UI.intro)}
                    </p>
                </motion.div>
            </section>

            {/* 2. INGREDIENT GRID */}
            <section className="relative w-full max-w-6xl mx-auto px-6 py-16">
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
                            className="group relative bg-[#120d08] border border-[#C9A84C]/10 rounded-2xl p-8 overflow-hidden cursor-default transition-all duration-500 hover:border-[#C9A84C]/40"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(201,168,76,0.15)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <div className="relative z-10 flex flex-col items-center text-center gap-4">
                                <span className="text-5xl drop-shadow-[0_0_15px_rgba(201,168,76,0.2)] group-hover:scale-110 transition-transform duration-500">
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
                                <p className="text-[#8B7355] text-sm leading-relaxed opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-20 transition-all duration-500 font-sans mt-2">
                                    {isAr ? item.descAr : item.descEn}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* 3. INTERACTIVE FILTER */}
            <section className="relative w-full py-16 flex flex-col items-center gap-6 px-6 z-20">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="flex flex-col items-center text-center gap-8"
                >
                    <h2 className="text-2xl md:text-3xl font-serif text-[#EBE5D9]">
                        {t(UI.discoverHeading)}
                    </h2>

                    <button
                        onClick={() => setFilterActive(!filterActive)}
                        className={`group relative inline-flex items-center justify-center px-10 py-4 rounded-full overflow-hidden transition-all duration-300 ${
                            filterActive
                                ? "scale-[0.98] shadow-[0_0_30px_rgba(201,168,76,0.4)] border-transparent"
                                : "hover:scale-[1.02] border border-[#C9A84C]/30 hover:border-[#C9A84C] shadow-none"
                        }`}
                        style={{
                            background: filterActive ? "linear-gradient(135deg, #D4AF37, #B8960C)" : "transparent",
                        }}
                    >
                        <span className={`relative text-sm md:text-base font-semibold tracking-wide flex items-center gap-3 transition-colors ${filterActive ? "text-[#0d0905]" : "text-[#C9A84C]"}`}>
                            {filterActive ? t(UI.filterActive) : t(UI.filterInactive)}
                        </span>
                    </button>

                    <p className="text-[#8B7355] text-sm">
                        {filterActive ? t(UI.filterSubActive) : t(UI.filterSubInactive)}
                    </p>
                </motion.div>
            </section>

            {/* 4. PRODUCT SHOWCASE */}
            <section className="relative w-full max-w-7xl mx-auto px-6 pb-32">
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
                        animate="visible"
                        variants={staggerContainer}
                        key={filterActive ? "filtered" : "all"}
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
