"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";
import { translations } from "@/i18n/translations";
import { getProducts, ProductForShop } from '@/lib/actions/products';

const FALLBACK_IMAGE = "/product_bottle1.png";

function ProductImage({ src, alt, priority }: { src: string; alt: string; priority: boolean }) {
    const [imgSrc, setImgSrc] = useState(src);
    return (
        <Image
            src={imgSrc}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
            priority={priority}
            className="object-contain p-12 transition-transform duration-1000 group-hover:scale-105 drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
    );
}

export default function ShopPage() {
    const { language } = useLanguage();
    const { formatPrice } = useCurrency();
    const { addItem, openCart } = useCart();
    const tShop = translations.shopPage;
    const tProd = translations.productData; // Keeping for reference if needed
    const tBtn = translations.productsSection;

    const [addedId, setAddedId] = useState<string | null>(null);
    const [dbProducts, setDbProducts] = useState<ProductForShop[]>([]);

    useEffect(() => {
        getProducts().then(setDbProducts).catch(console.error);
    }, []);

    const handleAddToCart = useCallback((product: ProductForShop, mappedProduct: any) => {
        addItem(mappedProduct);
        openCart();
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 1800);
    }, [addItem, openCart]);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <main className="min-h-screen bg-[#0A0806] text-[#EBE5D9] selection:bg-[#D4AF37]/30 selection:text-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>

            {/* Minimalist Shop Hero */}
            <section className="relative pt-32 pb-20 px-6 md:px-12 lg:px-24 overflow-hidden border-b border-[#D4AF37]/10">
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#3D2B1F_0%,_transparent_50%)]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className={language === 'ar' ? "text-[#D4AF37] text-xs tracking-[0.45em] uppercase font-light drop-shadow-sm mb-4 block" : "text-[#D4AF37] text-xs tracking-[0.45em] uppercase font-light drop-shadow-sm mb-4 block font-sans"}>
                            {tShop.shopLabel[language]}
                        </span>
                        <h1 className={language === 'ar' ? "font-arabic text-5xl md:text-7xl font-light text-white mb-6" : "font-serif text-5xl md:text-7xl font-light text-white mb-6 tracking-wide"}>
                            {tShop.title[language]}
                        </h1>
                        <p className={language === 'ar' ? "max-w-xl mx-auto text-[#EBE5D9]/70 font-light text-lg tracking-wide leading-relaxed" : "max-w-xl mx-auto text-[#EBE5D9]/70 font-sans font-light text-lg xl:text-xl tracking-wide leading-relaxed"}>
                            {tShop.desc[language]}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Products Grid */}
            <section className="py-24 px-6 md:px-12 lg:px-24">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 lg:gap-16 gap-24">
                    {dbProducts.length === 0 && (
                        <div className="col-span-1 lg:col-span-2 text-center text-[#D4AF37] opacity-80 py-20 flex justify-center items-center gap-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" className="animate-spin">
                                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                                <path d="M12 2 a10 10 0 0 1 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            {language === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...'}
                        </div>
                    )}
                    {dbProducts.map((p, idx) => {
                        const mappedProduct = {
                            id: p.id,
                            name: { en: p.name, ar: p.name_ar },
                            nameEn: { en: p.name, ar: p.name_ar },
                            priceValue: p.price_sar,
                            desc: {
                                en: p.description_en ? p.description_en.substring(0, 60) + "..." : "A whisper of pure refinement",
                                ar: p.description_ar ? p.description_ar.substring(0, 60) + "..." : "همسة من الرقي الخالص"
                            },
                            story: { en: p.description_en || "Experience the elegance.", ar: p.description_ar || "جرب الأناقة." },
                            notes: { en: [], ar: [] },
                            image: p.image_url || FALLBACK_IMAGE,
                            accent: "#D4AF37"
                        };
                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8, delay: idx % 2 * 0.1 }}
                                key={p.id}
                                id={p.id}
                                className="group flex flex-col gap-8"
                            >
                                {/* Product Image Window */}
                                <div className="relative aspect-[4/5] w-full bg-gradient-to-b from-[#1A0E08] to-[#0A0806] rounded-2xl border border-[#D4AF37]/15 overflow-hidden transition-all duration-700 hover:border-[#D4AF37]/40 shadow-2xl">

                                    {/* Background glow effect based on accent color */}
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700"
                                        style={{ background: `radial-gradient(circle at center, ${mappedProduct.accent}, transparent 70%)` }}
                                    />

                                    <ProductImage
                                        src={mappedProduct.image}
                                        alt={language === "ar"
                                            ? `${mappedProduct.name.ar} — ${mappedProduct.desc?.ar ?? ""}`
                                            : `${mappedProduct.name.en} by EDMA Perfume — ${mappedProduct.desc?.en ?? ""}`}
                                        priority={idx === 0}
                                    />

                                    {/* Glassmorphism Price Tag */}
                                    <div className={language === 'ar' ? "absolute top-6 left-6 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-arabic text-sm tracking-widest pointer-events-none" : "absolute top-6 right-6 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-sans text-xs tracking-widest pointer-events-none"}>
                                        {formatPrice(mappedProduct.priceValue)}
                                    </div>

                                    {/* Best Seller Badge (Top 2 Products) */}
                                    {idx < 2 && (
                                        <div className={language === 'ar' ? "absolute top-6 right-6 px-4 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#C9A84C] text-[#0A0806] text-xs font-arabic font-bold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)] z-10 pointer-events-none" : "absolute top-6 left-6 px-4 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#C9A84C] text-[#0A0806] text-[10px] uppercase font-bold tracking-widest rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)] z-10 pointer-events-none"}>
                                            {language === 'ar' ? 'الأكثر مبيعاً' : 'Best Seller'}
                                        </div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <h2 className={language === 'ar' ? "font-arabic text-4xl font-light text-white mb-2 group-hover:text-[#D4AF37] transition-colors duration-300" : "font-serif text-4xl font-light tracking-wide text-white mb-2 group-hover:text-[#D4AF37] transition-colors duration-300"}>
                                            {mappedProduct.name[language]}
                                        </h2>
                                        <p className="text-[#EBE5D9]/50 text-[10px] md:text-xs tracking-[0.3em] uppercase font-light font-sans">
                                            {mappedProduct.nameEn?.en || mappedProduct.name.en}
                                        </p>
                                    </div>

                                    {/* Urgency Tag */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/80 animate-pulse" />
                                        {p.low_stock ? (
                                            <span className={language === 'ar' ? "font-arabic text-xs font-medium text-red-400 tracking-wider" : "font-sans text-[10px] font-bold text-red-400 uppercase tracking-widest"}>
                                                {language === 'ar' ? `الكمية محدودة - تبقى ${p.stock_quantity} فقط!` : `Limited Stock - Only ${p.stock_quantity} Left!`}
                                            </span>
                                        ) : (
                                            <span className={language === 'ar' ? "font-arabic text-[11px] text-[#EBE5D9]/60 tracking-wider" : "font-sans text-[9px] uppercase tracking-widest text-[#EBE5D9]/60"}>
                                                {tBtn.exclusive[language]}
                                            </span>
                                        )}
                                    </div>

                                    <p className={language === 'ar' ? "font-arabic text-lg text-[#D4AF37] font-light" : "font-sans text-sm tracking-widest uppercase text-[#D4AF37] font-medium"}>
                                        {mappedProduct.desc[language]}
                                    </p>

                                    <p className={language === 'ar' ? "font-arabic text-[#EBE5D9]/70 text-base leading-relaxed font-light mb-1" : "font-sans text-[#EBE5D9]/70 text-base leading-relaxed font-light mb-1"}>
                                        {mappedProduct.story[language]}
                                    </p>

                                    {/* Trust Signal */}
                                    <p className={language === 'ar' ? "font-arabic text-sm text-[#D4AF37]/80 font-light mb-2 italic" : "font-serif text-sm md:text-base text-[#D4AF37]/80 italic mb-2 tracking-wide"}>
                                        {tShop.trustLine[language]}
                                    </p>

                                    {/* Fragrance Notes */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {/* Map empty notes array if no notes exist so nothing breaks */}
                                    </div>

                                    {/* Purchase Action Options */}
                                    <div className="flex flex-col sm:flex-row gap-4 mt-auto pt-4 border-t border-white/5">
                                        <button
                                            onClick={() => handleAddToCart(p, mappedProduct)}
                                            aria-label={language === "ar"
                                                ? `إضافة ${mappedProduct.name.ar} إلى السلة`
                                                : `Add ${mappedProduct.name.en} to cart`}
                                            className={language === 'ar' ? "flex-1 py-4 rounded-full font-arabic font-medium tracking-wide transition-all duration-300 hover:scale-105 active:scale-[0.98] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]" : "flex-1 py-4 rounded-full font-sans text-xs uppercase font-semibold tracking-widest transition-all duration-300 hover:scale-105 active:scale-[0.98] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"}
                                            style={{
                                                background: addedId === p.id
                                                    ? "linear-gradient(135deg, #2A7A2A, #3A9A3A)"
                                                    : "linear-gradient(135deg, #D4AF37, #E5C84A)",
                                                color: "#0A0806",
                                                transition: "background 0.4s ease, transform 0.3s ease, box-shadow 0.3s ease",
                                            }}
                                        >
                                            {addedId === p.id
                                                ? tBtn.added[language]
                                                : tShop.addToCart[language]}
                                        </button>
                                        <a
                                            href="https://wa.me/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={language === "ar"
                                                ? `اطلب ${mappedProduct.name.ar} عبر واتساب`
                                                : `Order ${mappedProduct.name.en} via WhatsApp`}
                                            className={language === 'ar' ? "flex-1 flex justify-center items-center py-4 border border-[#D4AF37]/30 rounded-full font-arabic text-[#EBE5D9] transition-all duration-300 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/50 hover:scale-105 font-light tracking-wide" : "flex-1 flex justify-center items-center py-4 border border-[#D4AF37]/30 rounded-full font-sans text-[11px] uppercase tracking-widest font-medium text-[#EBE5D9] transition-all duration-300 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/50 hover:scale-105"}
                                        >
                                            {tBtn.whatsapp[language]}
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}
