"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useCurrency, type Currency } from "@/context/CurrencyContext";
import { useAuth } from "@/context/AuthContext";
import { translations } from "@/i18n/translations";

const CURRENCIES: Currency[] = ["SAR", "KWD", "USD"];

export default function Navbar() {
    const [isScrolled,  setIsScrolled]  = useState(false);
    const [mobileOpen,  setMobileOpen]  = useState(false);
    const [currencyOpen, setCurrencyOpen] = useState(false);
    const { language, toggleLanguage }  = useLanguage();
    const { totalItems, openCart }      = useCart();
    const { currency, setCurrency }     = useCurrency();
    const { isLoggedIn, logout }        = useAuth();
    const pathname = usePathname();
    const t = translations.nav;

    const navLinks = [
        { name: t.story[language],    href: "/#story" },
        { name: t.topNotes[language], href: "/#top-notes" },
        { name: t.heart[language],    href: "/#heart" },
        { name: t.base[language],     href: "/#base" },
        { name: t.shop[language],     href: "/shop" },
    ];

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => { setMobileOpen(false); }, [pathname]);

    // Close currency dropdown on outside click
    useEffect(() => {
        if (!currencyOpen) return;
        const handler = () => setCurrencyOpen(false);
        document.addEventListener("click", handler, { capture: true });
        return () => document.removeEventListener("click", handler, { capture: true });
    }, [currencyOpen]);

    const isActive = (href: string) =>
        href === "/shop" ? pathname === "/shop" : false;

    return (
        <>
            <nav
                role="navigation"
                aria-label={language === "ar" ? "التنقل الرئيسي" : "Main navigation"}
                className={clsx(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-500 flex items-center justify-between px-6 md:px-12 h-16",
                    isScrolled
                        ? "bg-[#0A0806]/85 backdrop-blur-md border-b border-white/[0.04] shadow-[0_1px_20px_rgba(0,0,0,0.3)]"
                        : "bg-transparent py-2"
                )}
            >
                {/* Brand */}
                <div className="flex-1 flex items-center">
                    <Link
                        href="/"
                        aria-label={language === "ar" ? "الرئيسية — إدما العطور" : "Home — EDMA Perfume"}
                        className="font-serif text-xl md:text-2xl tracking-wide font-medium text-white/90 transition-colors duration-300 hover:text-[#D4AF37]"
                    >
                        {t.brand[language]}
                    </Link>
                </div>

                {/* Desktop nav links */}
                <nav
                    aria-label={language === "ar" ? "روابط التنقل" : "Navigation links"}
                    className="hidden md:flex flex-1 justify-center items-center gap-8"
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            aria-current={isActive(link.href) ? "page" : undefined}
                            className={clsx(
                                "nav-link text-sm tracking-wider font-light transition-colors duration-300",
                                isActive(link.href)
                                    ? "text-[#C9A84C]"
                                    : "text-[#EBE5D9]/65 hover:text-[#EBE5D9]"
                            )}
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>

                {/* Right controls */}
                <div className="flex-1 flex justify-end items-center gap-3 md:gap-4">
                    {/* Auth link — desktop only */}
                    {isLoggedIn ? (
                        <button
                            onClick={logout}
                            aria-label={language === "ar" ? "تسجيل الخروج" : "Log out"}
                            className="hidden md:flex items-center gap-1.5 text-xs tracking-widest font-light transition-colors duration-300 px-1 py-1 rounded-md hover:bg-white/5 text-[#EBE5D9]/45 hover:text-[#EBE5D9]/80"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                            </svg>
                            <span className={language === "ar" ? "font-arabic" : ""}>
                                {language === "ar" ? "خروج" : "Logout"}
                            </span>
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            aria-label={language === "ar" ? "تسجيل الدخول" : "Sign in to your account"}
                            className={clsx(
                                "hidden md:flex items-center gap-1.5 text-xs tracking-widest font-light transition-colors duration-300 px-1 py-1 rounded-md hover:bg-white/5",
                                pathname === "/login"
                                    ? "text-[#D4AF37]"
                                    : "text-[#EBE5D9]/45 hover:text-[#EBE5D9]/80"
                            )}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            <span className={language === "ar" ? "font-arabic" : ""}>
                                {language === "ar" ? "دخول" : "Login"}
                            </span>
                        </Link>
                    )}

                    {/* Language toggle */}
                    <button
                        onClick={toggleLanguage}
                        aria-label={language === "en"
                            ? "التبديل إلى العربية"
                            : "Switch to English"}
                        className="flex items-center gap-1.5 text-xs tracking-widest font-light transition-colors duration-300 px-1 py-1 rounded-md hover:bg-white/5"
                    >
                        <span className={language === "en"
                            ? "text-[#D4AF37] font-semibold"
                            : "text-[#EBE5D9]/45 hover:text-[#EBE5D9]/80 transition-colors"}>
                            EN
                        </span>
                        <span className="text-[#EBE5D9]/20 text-[10px]">|</span>
                        <span className={clsx(
                            "font-arabic",
                            language === "ar"
                                ? "text-[#D4AF37] font-semibold"
                                : "text-[#EBE5D9]/45 hover:text-[#EBE5D9]/80 transition-colors"
                        )}>
                            AR
                        </span>
                    </button>

                    {/* Currency selector */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setCurrencyOpen(o => !o)}
                            aria-expanded={currencyOpen}
                            aria-haspopup="listbox"
                            aria-label="Select currency"
                            className="flex items-center gap-1 text-xs tracking-widest font-light transition-colors duration-300 px-2 py-1 rounded-md hover:bg-white/5 text-[#D4AF37]"
                        >
                            {currency}
                            <svg className={`w-2.5 h-2.5 transition-transform duration-200 ${currencyOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 10 6" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l4 4 4-4" />
                            </svg>
                        </button>
                        <AnimatePresence>
                            {currencyOpen && (
                                <motion.ul
                                    role="listbox"
                                    aria-label="Currency options"
                                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-full mt-2 right-0 bg-[#0A0806]/95 backdrop-blur-xl border border-[#D4AF37]/15 rounded-lg overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-w-[72px] z-50"
                                >
                                    {CURRENCIES.map((c) => (
                                        <li
                                            key={c}
                                            role="option"
                                            aria-selected={c === currency}
                                            onClick={() => { setCurrency(c); setCurrencyOpen(false); }}
                                            className={`px-4 py-2 text-xs tracking-widest cursor-pointer transition-colors duration-150 ${
                                                c === currency
                                                    ? "text-[#D4AF37] bg-[#D4AF37]/10"
                                                    : "text-[#EBE5D9]/55 hover:text-[#EBE5D9] hover:bg-white/5"
                                            }`}
                                        >
                                            {c}
                                        </li>
                                    ))}
                                </motion.ul>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Cart icon */}
                    <button
                        onClick={openCart}
                        aria-label={language === "ar"
                            ? `فتح السلة — ${totalItems} منتج`
                            : `Open cart — ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
                        className="relative w-9 h-9 flex items-center justify-center rounded-full text-[#EBE5D9]/65 hover:text-[#C9A84C] border border-transparent hover:border-[#C9A84C]/30 hover:bg-[#C9A84C]/5 transition-all duration-300 btn-ghost-gold"
                    >
                        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.853-7.18a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                        <AnimatePresence>
                            {totalItems > 0 && (
                                <motion.span
                                    key="badge"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                    aria-hidden="true"
                                    className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-[#C9A84C] text-[#0A0806] text-[9px] font-bold leading-none"
                                >
                                    {totalItems > 9 ? "9+" : totalItems}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>

                    {/* Discover CTA */}
                    <Link
                        href="/shop"
                        aria-label={language === "ar" ? "اكتشف مجموعة إدما" : "Discover the EDMA collection"}
                        className="hidden sm:block relative group overflow-hidden rounded-full p-[1px] transition-transform duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                    >
                        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] via-[#FFBF00] to-[#D4AF37] opacity-50 group-hover:opacity-90 transition-opacity duration-500 rounded-full blur-sm" />
                        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/80 via-white/20 to-[#D4AF37]/80 opacity-35 rounded-full" />
                        <span className="relative block px-5 py-2 bg-[#0A0806] rounded-full text-xs font-medium text-white/85 tracking-wide transition-colors duration-300 group-hover:bg-[#120F0D]">
                            {t.discover[language]}
                        </span>
                    </Link>

                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setMobileOpen(o => !o)}
                        aria-expanded={mobileOpen}
                        aria-controls="mobile-nav"
                        aria-label={language === "ar"
                            ? (mobileOpen ? "إغلاق القائمة" : "فتح القائمة")
                            : (mobileOpen ? "Close menu" : "Open menu")}
                        className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-[#EBE5D9]/65 hover:text-[#C9A84C] border border-transparent hover:border-[#C9A84C]/20 transition-all duration-300"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            {mobileOpen
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                            }
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Mobile menu panel */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        id="mobile-nav"
                        role="dialog"
                        aria-modal="true"
                        aria-label={language === "ar" ? "قائمة التنقل" : "Navigation menu"}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22 }}
                        className="fixed top-16 left-0 right-0 z-40 bg-[#0A0806]/95 backdrop-blur-xl border-b border-[#C9A84C]/10 px-6 py-6 flex flex-col gap-5 md:hidden"
                        dir={language === "ar" ? "rtl" : "ltr"}
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                aria-current={isActive(link.href) ? "page" : undefined}
                                className={clsx(
                                    "nav-link font-light tracking-wider transition-colors duration-200 py-1",
                                    language === "ar" ? "font-arabic text-lg" : "font-sans text-sm uppercase",
                                    isActive(link.href) ? "text-[#C9A84C]" : "text-[#EBE5D9]/75 hover:text-[#EBE5D9]"
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />
                        <div className="flex items-center justify-between">
                            {isLoggedIn ? (
                                <button
                                    onClick={() => { logout(); setMobileOpen(false); }}
                                    className={clsx(
                                        "flex items-center gap-2 font-light tracking-wider transition-colors duration-200 py-1 text-[#EBE5D9]/75 hover:text-[#EBE5D9]",
                                        language === "ar" ? "font-arabic text-lg" : "font-sans text-sm uppercase"
                                    )}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                    </svg>
                                    {language === "ar" ? "خروج" : "Logout"}
                                </button>
                            ) : (
                                <Link
                                    href="/login"
                                    className={clsx(
                                        "flex items-center gap-2 font-light tracking-wider transition-colors duration-200 py-1",
                                        language === "ar" ? "font-arabic text-lg" : "font-sans text-sm uppercase",
                                        pathname === "/login" ? "text-[#C9A84C]" : "text-[#EBE5D9]/75 hover:text-[#EBE5D9]"
                                    )}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                    {language === "ar" ? "دخول" : "Login"}
                                </Link>
                            )}
                            <Link
                                href="/shop"
                                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E5C84A] text-[#0A0806] font-sans text-xs uppercase tracking-widest font-semibold"
                            >
                                {t.discover[language]}
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
