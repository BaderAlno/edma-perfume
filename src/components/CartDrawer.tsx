"use client";

import Image from "next/image";
import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { translations } from "@/i18n/translations";

// ─── Sub-components ───────────────────────────────────────────────────────────

function QtyButton({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-[#C9A84C]/40 text-[#C9A84C] text-base leading-none transition-colors duration-200 hover:bg-[#C9A84C]/10 disabled:opacity-30 disabled:cursor-not-allowed"
        >
            {label}
        </button>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CartDrawer() {
    const { items, isOpen, removeItem, updateQty, closeCart, totalPrice } = useCart();
    const { language } = useLanguage();
    const { formatPrice } = useCurrency();
    const router = useRouter();
    const t = translations.cart;

    // ── Body scroll-lock ───────────────────────────────────────────────────
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    // ── Escape key ─────────────────────────────────────────────────────────
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") closeCart();
    }, [closeCart]);

    useEffect(() => {
        if (!isOpen) return;
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleKeyDown]);

    const isEmpty = items.length === 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* ── Backdrop ──────────────────────────────────────── */}
                    <motion.div
                        key="cart-backdrop"
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={closeCart}
                        aria-hidden
                    />

                    {/* ── Drawer panel ──────────────────────────────────── */}
                    <motion.aside
                        key="cart-drawer"
                        role="dialog"
                        aria-modal="true"
                        aria-label={t.title[language]}
                        dir={language === "ar" ? "rtl" : "ltr"}
                        className="fixed top-0 right-0 z-[61] h-full w-full max-w-[420px] flex flex-col bg-[#0D0A07] border-l border-[#C9A84C]/15 shadow-[−20px_0_60px_rgba(0,0,0,0.6)]"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 280, damping: 28 }}
                    >
                        {/* ── Header ──────────────────────────────────── */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#C9A84C]/10 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                {/* Cart icon */}
                                <svg className="w-5 h-5 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.853-7.18a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                </svg>
                                <span className={`${language === "ar" ? "font-arabic" : "font-serif"} text-[#EBE5D9] text-lg font-light tracking-wide`}>
                                    {t.title[language]}
                                </span>
                                {/* Item count badge */}
                                {!isEmpty && (
                                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#C9A84C] text-[#0D0A07] text-[10px] font-bold">
                                        {items.reduce((s, i) => s + i.quantity, 0)}
                                    </span>
                                )}
                            </div>

                            {/* Close button */}
                            <button
                                onClick={closeCart}
                                aria-label="Close cart"
                                className="w-8 h-8 flex items-center justify-center rounded-full border border-[#C9A84C]/20 text-[#EBE5D9]/50 hover:text-[#C9A84C] hover:border-[#C9A84C]/50 transition-colors duration-200"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* ── Body ────────────────────────────────────── */}
                        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 scrollbar-thin">

                            {isEmpty ? (
                                /* ── Empty state ─────────────────────── */
                                <div className="h-full flex flex-col items-center justify-center gap-6 py-16 text-center">
                                    {/* Decorative bag */}
                                    <div className="w-20 h-20 rounded-full border border-[#C9A84C]/20 flex items-center justify-center">
                                        <svg className="w-9 h-9 text-[#C9A84C]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.853-7.18a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                        </svg>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <p className={`${language === "ar" ? "font-arabic text-xl" : "font-serif text-xl"} text-[#EBE5D9] font-light`}>
                                            {t.empty[language]}
                                        </p>
                                        <p className={`${language === "ar" ? "font-arabic text-sm" : "font-sans text-xs uppercase tracking-widest"} text-[#EBE5D9]/40`}>
                                            {t.emptySubtitle[language]}
                                        </p>
                                    </div>

                                    {/* Gold divider */}
                                    <div className="w-12 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/50 to-transparent" />

                                    <button
                                        onClick={closeCart}
                                        className={`${language === "ar" ? "font-arabic text-sm" : "font-sans text-xs uppercase tracking-[0.15em]"} px-8 py-3 rounded-full border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors duration-300`}
                                    >
                                        {t.continueShopping[language]}
                                    </button>
                                </div>

                            ) : (
                                /* ── Item list ───────────────────────── */
                                <ul className="flex flex-col divide-y divide-[#C9A84C]/8">
                                    <AnimatePresence initial={false}>
                                        {items.map((item) => (
                                            <motion.li
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0, marginBlock: 0 }}
                                                transition={{ duration: 0.28, ease: "easeInOut" }}
                                                className="py-5 overflow-hidden"
                                            >
                                                <div className="flex gap-4">

                                                    {/* Thumbnail */}
                                                    <div className="relative w-16 h-16 bg-[#1A1410] rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name[language]}
                                                            fill
                                                            className="object-cover"
                                                            sizes="64px"
                                                        />
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">

                                                        {/* Name + remove */}
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <p className={`${language === "ar" ? "font-arabic text-base" : "font-serif text-base"} text-[#EBE5D9] font-light leading-snug`}>
                                                                    {item.name[language]}
                                                                </p>
                                                                <p className={`${language === "ar" ? "font-arabic text-xs" : "font-sans text-[10px] uppercase tracking-wider"} text-[#C9A84C]/70 mt-0.5`}>
                                                                    {formatPrice(item.price_sar)}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => removeItem(item.id)}
                                                                aria-label={`${t.remove[language]} ${item.name[language]}`}
                                                                className="flex-shrink-0 text-[#EBE5D9]/25 hover:text-red-400/70 transition-colors duration-200 mt-0.5"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                </svg>
                                                            </button>
                                                        </div>

                                                        {/* Qty controls + line total */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <QtyButton
                                                                    onClick={() => updateQty(item.id, -1)}
                                                                    label="−"
                                                                    disabled={item.quantity <= 1}
                                                                />
                                                                <span className="w-6 text-center text-sm text-[#EBE5D9] tabular-nums">
                                                                    {item.quantity}
                                                                </span>
                                                                <QtyButton
                                                                    onClick={() => updateQty(item.id, +1)}
                                                                    label="+"
                                                                />
                                                            </div>
                                                            <p className={`${language === "ar" ? "font-arabic text-sm" : "font-sans text-xs"} text-[#EBE5D9]/70 tabular-nums`}>
                                                                {formatPrice(item.price_sar * item.quantity)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            )}
                        </div>

                        {/* ── Footer (shown only when cart has items) ── */}
                        <AnimatePresence>
                            {!isEmpty && (
                                <motion.div
                                    key="cart-footer"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.25 }}
                                    className="flex-shrink-0 px-6 pt-4 pb-6 border-t border-[#C9A84C]/10 space-y-4"
                                    dir={language === "ar" ? "rtl" : "ltr"}
                                >
                                    {/* Free delivery note */}
                                    <p className={`${language === "ar" ? "font-arabic text-xs" : "font-sans text-[10px] uppercase tracking-widest"} text-[#C9A84C]/50 text-center`}>
                                        {t.freeDelivery[language]}
                                    </p>

                                    {/* Total row */}
                                    <div className="flex items-center justify-between">
                                        <span className={`${language === "ar" ? "font-arabic text-base" : "font-sans text-xs uppercase tracking-widest"} text-[#EBE5D9]/60`}>
                                            {t.total[language]}
                                        </span>
                                        <span className={`${language === "ar" ? "font-arabic text-2xl" : "font-serif text-2xl"} text-[#C9A84C] font-light tabular-nums`}>
                                            {formatPrice(totalPrice)}
                                        </span>
                                    </div>

                                    {/* Checkout button */}
                                    <button
                                        onClick={() => { closeCart(); router.push("/checkout"); }}
                                        className={`w-full relative overflow-hidden rounded-full py-4 ${language === "ar" ? "font-arabic text-base font-medium" : "font-sans text-xs uppercase font-semibold tracking-[0.15em]"} text-[#0D0A07] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(201,168,76,0.4)] active:scale-[0.98]`}
                                        style={{ background: "linear-gradient(135deg, #C9A84C, #E5C84A, #C9A84C)" }}
                                    >
                                        {/* Subtle shimmer line */}
                                        <span className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                                        {t.checkout[language]}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
