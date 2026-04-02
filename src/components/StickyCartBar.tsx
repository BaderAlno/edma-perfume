"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { translations } from "@/i18n/translations";
import { usePathname } from "next/navigation";

export default function StickyCartBar() {
    const [isVisible, setIsVisible] = useState(false);
    const [added, setAdded] = useState(false);
    const { language } = useLanguage();
    const { addItem, openCart } = useCart();
    const pathname = usePathname();
    const { formatPrice } = useCurrency();
    const t = translations.stickyCart;
    // Elinor is the flagship product (index 0)
    const flagship = translations.productData[0];

    const handleAddToCart = () => {
        addItem(flagship);
        openCart();
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
    };

    useEffect(() => {
        const handleScroll = () => {
            if (pathname?.startsWith('/admin') || pathname?.startsWith('/checkout') || pathname?.startsWith('/success')) {
                setIsVisible(false);
                return;
            }
            // Show bar after scrolling past 100vh (the initial Hero viewport)
            if (window.scrollY > window.innerHeight * 0.8) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Check initial state
        return () => window.removeEventListener("scroll", handleScroll);
    }, [pathname]);

    if (pathname?.startsWith('/admin') || pathname?.startsWith('/checkout') || pathname?.startsWith('/success')) {
        return null;
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 md:px-8 md:pb-6 pointer-events-none"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                    <div className="max-w-4xl mx-auto pointer-events-auto">
                        <div className="bg-[#0A0806]/60 backdrop-blur-xl border border-[#D4AF37]/20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] rounded-2xl p-4 flex items-center justify-between gap-4 transition-all duration-300 hover:border-[#D4AF37]/40 hover:bg-[#0A0806]/70">

                            {/* Product Info */}
                            <div className="flex flex-col">
                                <h3 className="font-arabic text-white text-lg md:text-xl font-light tracking-wide">
                                    {t.brand[language]}
                                </h3>
                                <p className="font-serif text-[#D4AF37] text-sm md:text-base tracking-widest">
                                    {formatPrice(flagship.priceValue)}
                                </p>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                aria-label={language === "ar"
                                    ? `إضافة ${flagship.name.ar} إلى السلة`
                                    : `Add ${flagship.name.en} to cart`}
                                className="group relative overflow-hidden rounded-full flex-shrink-0"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-[#C9A227] via-[#E5C84A] to-[#C9A227] transition-all duration-500 hover:scale-110" />
                                <span className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                                <span className="relative block px-6 md:px-10 py-2.5 md:py-3 font-arabic text-[#1A0E08] font-medium text-sm md:text-base tracking-wide transition-transform duration-300 group-hover:-translate-y-0.5 shadow-[0_5px_15px_rgba(212,175,55,0.3)] group-hover:shadow-[0_8px_25px_rgba(212,175,55,0.5)]">
                                    {added
                                        ? (language === "ar" ? "تمت الإضافة ✓" : "Added ✓")
                                        : t.addToCart[language]}
                                </span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
