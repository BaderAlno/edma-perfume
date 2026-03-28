"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useElements,
    useStripe,
} from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";

// ─── Stripe singleton (created once outside render) ───────────────────────────
const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

// True when the publishable key is a Stripe test key (pk_test_...)
const IS_STRIPE_TEST = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "").startsWith("pk_test_");

// ─── Stripe Element appearance: luxury dark theme ─────────────────────────────
const STRIPE_APPEARANCE = {
    theme: "night" as const,
    variables: {
        colorPrimary:        "#C9A84C",
        colorBackground:     "#1A0E08",
        colorText:           "#EBE5D9",
        colorTextSecondary:  "#8B7355",
        colorTextPlaceholder:"#5C4033",
        colorDanger:         "#e57373",
        colorSuccess:        "#4caf50",
        fontFamily:          "Inter, Arial, sans-serif",
        fontSizeBase:        "14px",
        borderRadius:        "8px",
        spacingGridRow:      "20px",
    },
    rules: {
        ".Input": {
            border:          "1px solid rgba(201, 168, 76, 0.2)",
            boxShadow:       "none",
            backgroundColor: "#0D0A07",
            transition:      "border-color 0.2s ease",
        },
        ".Input:focus": {
            border:    "1px solid rgba(201, 168, 76, 0.6)",
            boxShadow: "0 0 0 3px rgba(201, 168, 76, 0.08)",
        },
        ".Label": {
            color:         "#8B7355",
            fontSize:      "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight:    "400",
        },
        ".Tab": {
            border:          "1px solid rgba(201, 168, 76, 0.15)",
            backgroundColor: "#0D0A07",
        },
        ".Tab--selected": {
            border:     "1px solid rgba(201, 168, 76, 0.5)",
            boxShadow:  "0 0 0 3px rgba(201, 168, 76, 0.08)",
        },
        ".Error": { color: "#e57373" },
    },
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
function GoldSpinner({ size = 20 }: { size?: number }) {
    return (
        <svg
            width={size} height={size} viewBox="0 0 24 24"
            className="animate-spin"
            style={{ animationDuration: "0.8s" }}
        >
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="2.5" />
            <path
                d="M12 2 a10 10 0 0 1 10 10"
                fill="none" stroke="#C9A84C" strokeWidth="2.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

// ─── Mock bypass form (used when Stripe API key is invalid/placeholder) ───────
function MockBypassForm({
    email, setEmail, language,
}: {
    email:    string;
    setEmail: (v: string) => void;
    language: "en" | "ar";
}) {
    const router = useRouter();
    const { items } = useCart();
    const isAr = language === "ar";
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSimulate = async () => {
        if (!email) return;
        setIsProcessing(true);
        try {
            sessionStorage.setItem("edma-checkout-email",    email);
            sessionStorage.setItem("edma-checkout-items",    JSON.stringify(
                items.map(i => ({ id: i.id, quantity: i.quantity }))
            ));
            sessionStorage.setItem("edma-checkout-language", language);
        } catch { /* ignore */ }

        const mockPiId = `pi_mock_${Date.now()}`;
        const params = new URLSearchParams({
            payment_intent:               mockPiId,
            payment_intent_client_secret: `${mockPiId}_secret_test_bypass`,
            redirect_status:              "succeeded",
        });
        router.push(`/success?${params.toString()}`);
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); handleSimulate(); }} className="flex flex-col gap-6">
            {/* Mock mode banner */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                </svg>
                <div className="flex flex-col gap-0.5">
                    <p className="font-sans text-[10px] uppercase tracking-wider text-amber-400 font-semibold">
                        Test Mode — Mock Payment
                    </p>
                    <p className="font-sans text-xs text-amber-300/70 leading-relaxed">
                        Stripe keys are placeholder values. Enter your email and simulate a successful payment to test the full flow.
                    </p>
                </div>
            </div>

            {/* Section label */}
            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-[#C9A84C]/40 to-transparent" />
                <span className={`${isAr ? "font-arabic text-sm" : "font-sans text-[10px] uppercase tracking-[0.3em]"} text-[#C9A84C]/70`}>
                    {isAr ? "تفاصيل الدفع" : "Payment Details"}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-[#C9A84C]/40 to-transparent" />
            </div>

            {/* Email input */}
            <div className="flex flex-col gap-2">
                <label
                    htmlFor="mock-email"
                    className={`${isAr ? "font-arabic text-xs" : "font-sans text-[10px] uppercase tracking-[0.2em]"} text-[#8B7355]`}
                >
                    {isAr ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <input
                    id="mock-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    dir="ltr"
                    placeholder={isAr ? "بريدك@مثال.com" : "your@email.com"}
                    className="w-full px-4 py-3 rounded-lg bg-[#0D0A07] border border-[#C9A84C]/20 text-[#EBE5D9] text-sm placeholder:text-[#5C4033] focus:outline-none focus:border-[#C9A84C]/60 focus:ring-1 focus:ring-[#C9A84C]/20 transition-colors duration-200"
                />
            </div>

            {/* Simulate button */}
            <button
                type="submit"
                disabled={!email || isProcessing}
                className="relative w-full py-4 rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                <span className="absolute inset-0 bg-gradient-to-r from-[#C9A84C] via-[#E5C84A] to-[#C9A84C]" />
                <span className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <span className="relative flex items-center justify-center gap-3">
                    {isProcessing && <GoldSpinner size={18} />}
                    <span className={`${isAr ? "font-arabic text-base" : "font-sans text-xs uppercase tracking-[0.15em]"} text-[#0D0A07] font-semibold`}>
                        {isAr ? "محاكاة دفع ناجح" : "Simulate Successful Payment"}
                    </span>
                </span>
            </button>
        </form>
    );
}

// ─── Order Summary sidebar ────────────────────────────────────────────────────
function OrderSummary({ language }: { language: "en" | "ar" }) {
    const { items, totalPrice } = useCart();
    const { formatPrice } = useCurrency();
    const isAr = language === "ar";

    return (
        <div className="flex flex-col gap-6">
            {/* Title */}
            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-[#C9A84C]/40 to-transparent" />
                <span className={`${isAr ? "font-arabic text-sm" : "font-sans text-[10px] uppercase tracking-[0.3em]"} text-[#C9A84C]/70`}>
                    {isAr ? "ملخص الطلب" : "Order Summary"}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-[#C9A84C]/40 to-transparent" />
            </div>

            {/* Items */}
            <ul className="flex flex-col gap-4">
                {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4">
                        {/* Thumbnail */}
                        <div
                            className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0"
                            style={{ background: `${item.accent}18` }}
                        >
                            <Image
                                src={item.image}
                                alt={item.name[language]}
                                fill
                                sizes="56px"
                                className="object-contain p-1.5"
                            />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className={`${isAr ? "font-arabic text-base" : "font-serif text-base"} text-[#EBE5D9] font-light truncate`}>
                                {item.name[language]}
                            </p>
                            <p className={`${isAr ? "font-arabic text-xs" : "font-sans text-[10px] uppercase tracking-wider"} text-[#8B7355]`}>
                                {isAr ? `الكمية: ${item.quantity}` : `Qty: ${item.quantity}`}
                            </p>
                        </div>
                        {/* Line total */}
                        <p className={`${isAr ? "font-arabic text-sm" : "font-sans text-sm"} text-[#C9A84C] flex-shrink-0 tabular-nums`}>
                            {formatPrice(item.priceValue * item.quantity)}
                        </p>
                    </li>
                ))}
            </ul>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />

            {/* Totals */}
            <div className="flex flex-col gap-3">
                {/* Shipping */}
                <div className="flex items-center justify-between">
                    <span className={`${isAr ? "font-arabic text-sm" : "font-sans text-xs uppercase tracking-wider"} text-[#8B7355]`}>
                        {isAr ? "التوصيل" : "Delivery"}
                    </span>
                    <span className={`${isAr ? "font-arabic text-sm" : "font-sans text-xs uppercase tracking-wider"} text-[#C9A84C]`}>
                        {isAr ? "مجاني" : "Free"}
                    </span>
                </div>
                {/* Total */}
                <div className="flex items-center justify-between pt-2 border-t border-[#C9A84C]/15">
                    <span className={`${isAr ? "font-arabic text-base" : "font-sans text-xs uppercase tracking-widest"} text-[#EBE5D9]/70`}>
                        {isAr ? "المجموع" : "Total"}
                    </span>
                    <span className={`${isAr ? "font-arabic text-2xl" : "font-serif text-2xl"} text-[#C9A84C] font-light tabular-nums`}>
                        {formatPrice(totalPrice)}
                    </span>
                </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-2 pt-2">
                {[
                    { icon: "🔒", en: "Secure Payment",       ar: "دفع آمن" },
                    { icon: "📦", en: "Luxury Packaging",     ar: "تغليف فاخر" },
                    { icon: "✓",  en: "100% Authentic",       ar: "أصالة مضمونة" },
                    { icon: "↩",  en: "Free Returns",         ar: "إرجاع مجاني" },
                ].map(b => (
                    <div key={b.en} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1A0E08] border border-[#C9A84C]/10">
                        <span className="text-xs">{b.icon}</span>
                        <span className={`${isAr ? "font-arabic text-xs" : "font-sans text-[9px] uppercase tracking-wide"} text-[#8B7355]`}>
                            {isAr ? b.ar : b.en}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Payment form (must be inside <Elements>) ─────────────────────────────────
function PaymentForm({
    email, setEmail, totalPrice, language,
}: {
    email:      string;
    setEmail:   (v: string) => void;
    totalPrice: number;
    language:   "en" | "ar";
}) {
    const stripe    = useStripe();
    const elements  = useElements();
    const { items, clearCart } = useCart();
    const { formatPrice } = useCurrency();
    const isAr      = language === "ar";

    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg,     setErrorMsg]     = useState<string | null>(null);
    const [isReady,      setIsReady]      = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements || !email) return;

        setIsProcessing(true);
        setErrorMsg(null);

        // Persist email + items for the success page (use sessionStorage not URL)
        try {
            sessionStorage.setItem("edma-checkout-email",    email);
            sessionStorage.setItem("edma-checkout-items",    JSON.stringify(
                items.map(i => ({ id: i.id, quantity: i.quantity }))
            ));
            sessionStorage.setItem("edma-checkout-language", language);
        } catch { /* ignore */ }

        // Build absolute return URL (handles basePath)
        const basePath  = process.env.NEXT_PUBLIC_BASE_PATH ?? "/Edma-Perf";
        const returnUrl = `${window.location.origin}${basePath}/success`;

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: returnUrl,
                payment_method_data: {
                    billing_details: { email },
                },
            },
        });

        // confirmPayment only returns here on error (on success Stripe redirects)
        if (error) {
            setErrorMsg(
                error.type === "card_error" || error.type === "validation_error"
                    ? (error.message ?? isAr ? "فشل الدفع" : "Payment failed")
                    : (isAr ? "حدث خطأ غير متوقع" : "An unexpected error occurred")
            );
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Section label */}
            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-[#C9A84C]/40 to-transparent" />
                <span className={`${isAr ? "font-arabic text-sm" : "font-sans text-[10px] uppercase tracking-[0.3em]"} text-[#C9A84C]/70`}>
                    {isAr ? "تفاصيل الدفع" : "Payment Details"}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-[#C9A84C]/40 to-transparent" />
            </div>

            {/* Email input */}
            <div className="flex flex-col gap-2">
                <label
                    htmlFor="checkout-email"
                    className={`${isAr ? "font-arabic text-xs" : "font-sans text-[10px] uppercase tracking-[0.2em]"} text-[#8B7355]`}
                >
                    {isAr ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <input
                    id="checkout-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    dir="ltr"
                    placeholder={isAr ? "بريدك@مثال.com" : "your@email.com"}
                    className="w-full px-4 py-3 rounded-lg bg-[#0D0A07] border border-[#C9A84C]/20 text-[#EBE5D9] text-sm placeholder:text-[#5C4033] focus:outline-none focus:border-[#C9A84C]/60 focus:ring-1 focus:ring-[#C9A84C]/20 transition-colors duration-200"
                />
            </div>

            {/* Stripe PaymentElement */}
            <div className="relative">
                {/* Skeleton while loading */}
                <AnimatePresence>
                    {!isReady && (
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 z-10 flex flex-col gap-3 pointer-events-none"
                        >
                            {[80, 50, 110].map((h, i) => (
                                <div
                                    key={i}
                                    className="rounded-lg bg-[#1A0E08] animate-pulse"
                                    style={{ height: h }}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
                <PaymentElement
                    onReady={() => setIsReady(true)}
                    options={{ layout: "tabs" }}
                />
            </div>

            {/* Error message */}
            <AnimatePresence>
                {errorMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                        dir={isAr ? "rtl" : "ltr"}
                    >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                        </svg>
                        <span className={isAr ? "font-arabic" : "font-sans"}>{errorMsg}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pay button */}
            <button
                type="submit"
                disabled={!stripe || !elements || isProcessing || !email}
                className="relative w-full py-4 rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(201,168,76,0.35)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
                <span className="absolute inset-0 bg-gradient-to-r from-[#C9A84C] via-[#E5C84A] to-[#C9A84C]" />
                <span className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <span className="relative flex items-center justify-center gap-3">
                    {isProcessing ? (
                        <>
                            <GoldSpinner size={18} />
                            <span className={`${isAr ? "font-arabic text-base" : "font-sans text-xs uppercase tracking-[0.15em]"} text-[#0D0A07] font-semibold`}>
                                {isAr ? "جارٍ المعالجة..." : "Processing..."}
                            </span>
                        </>
                    ) : (
                        <span className={`${isAr ? "font-arabic text-base" : "font-sans text-xs uppercase tracking-[0.15em]"} text-[#0D0A07] font-semibold`}>
                            {isAr ? `ادفع ${formatPrice(totalPrice)}` : `Pay ${formatPrice(totalPrice)}`}
                        </span>
                    )}
                </span>
            </button>

            {/* Stripe secure badge */}
            <p className="text-center text-[#5C4033] text-[10px] tracking-wider font-sans flex items-center justify-center gap-1.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.25 3.75 10.17 9 11.34C17.25 21.17 21 16.25 21 11V5L12 1zm0 6a2 2 0 110 4 2 2 0 010-4zm3 8H9v-1c0-2 4-3.1 6-1.4V15z"/>
                </svg>
                {isAr ? "مدفوعات آمنة بواسطة Stripe" : "Secured by Stripe"}
            </p>
        </form>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
    const { items, totalPrice } = useCart();
    const { language }          = useLanguage();
    const router                = useRouter();
    const isAr                  = language === "ar";

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [fetchError,   setFetchError]   = useState<string | null>(null);
    const [email,        setEmail]        = useState("");

    // If cart is empty, redirect to shop
    useEffect(() => {
        if (items.length === 0) router.replace("/shop");
    }, [items, router]);

    // Fetch PaymentIntent once on mount
    const fetchedRef = useRef(false);
    useEffect(() => {
        if (items.length === 0 || fetchedRef.current) return;
        fetchedRef.current = true;

        fetch("/Edma-Perf/api/create-payment-intent", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
                items: items.map(i => ({ id: i.id, quantity: i.quantity })),
            }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                } else {
                    setFetchError(data.error ?? "Failed to initialise payment.");
                }
            })
            .catch(() => setFetchError("Network error. Please try again."));
    }, [items]);

    if (items.length === 0) return null; // handled by redirect above

    return (
        <main
            className="min-h-screen bg-[#0A0806] text-[#EBE5D9]"
            dir={isAr ? "rtl" : "ltr"}
        >
            {/* ── Page header ───────────────────────────────────────────── */}
            <div className="border-b border-[#C9A84C]/10 px-6 md:px-12 py-6 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-[#8B7355] hover:text-[#C9A84C] transition-colors duration-200"
                >
                    <svg className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className={`${isAr ? "font-arabic text-sm" : "font-sans text-[10px] uppercase tracking-wider"}`}>
                        {isAr ? "رجوع" : "Back"}
                    </span>
                </button>

                <span className={`${isAr ? "font-arabic text-base" : "font-serif text-lg"} tracking-widest text-[#EBE5D9]/80`}>
                    {isAr ? "إتمام الشراء" : "Checkout"}
                </span>

                {/* Brand */}
                <span className="text-[#C9A84C]/60 text-xs tracking-[0.4em] font-sans uppercase hidden md:block">
                    EDMA
                </span>
            </div>

            {/* ── Content ───────────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-6 md:px-12 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-16">

                    {/* ── Left / top: order summary ──────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="p-6 md:p-8 rounded-2xl border border-[#C9A84C]/10 bg-[#0D0A07] self-start"
                    >
                        <OrderSummary language={language} />
                    </motion.div>

                    {/* ── Right / bottom: payment form ───────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="p-6 md:p-8 rounded-2xl border border-[#C9A84C]/10 bg-[#0D0A07] self-start"
                    >
                        {fetchError ? (
                            /* ── Error state ─────────────────────────── */
                            <div className="flex flex-col items-center gap-4 py-8 text-center">
                                <div className="w-12 h-12 rounded-full border border-red-500/30 flex items-center justify-center text-red-400">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                                    </svg>
                                </div>
                                <p className={`${isAr ? "font-arabic" : "font-sans"} text-red-400/80 text-sm`}>{fetchError}</p>
                                <button
                                    onClick={() => { fetchedRef.current = false; setFetchError(null); }}
                                    className={`${isAr ? "font-arabic text-sm" : "font-sans text-xs uppercase tracking-wider"} text-[#C9A84C] border border-[#C9A84C]/30 px-6 py-2.5 rounded-full hover:bg-[#C9A84C]/10 transition-colors`}
                                >
                                    {isAr ? "إعادة المحاولة" : "Try Again"}
                                </button>
                            </div>

                        ) : !clientSecret ? (
                            /* ── Loading skeleton ────────────────────── */
                            <div className="flex flex-col gap-5 py-4">
                                <div className="flex items-center justify-center gap-3 py-4 text-[#C9A84C]/60">
                                    <GoldSpinner size={20} />
                                    <span className={`${isAr ? "font-arabic text-sm" : "font-sans text-xs uppercase tracking-wider"} text-[#8B7355]`}>
                                        {isAr ? "جارٍ التحميل..." : "Loading payment form..."}
                                    </span>
                                </div>
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-12 rounded-lg bg-[#1A0E08] animate-pulse" />
                                ))}
                            </div>

                        ) : clientSecret.startsWith("pi_mock_") ? (
                            /* ── Mock bypass (Stripe key is placeholder) ─ */
                            <MockBypassForm
                                email={email}
                                setEmail={setEmail}
                                language={language}
                            />

                        ) : (
                            /* ── Real Stripe PaymentElement ──────────── */
                            <>
                                {/* Test card reminder — shown when pk_test_ key is active */}
                                {IS_STRIPE_TEST && (
                                    <div className="flex items-start gap-3 px-4 py-3 mb-5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="font-sans text-[10px] uppercase tracking-wider text-blue-400 font-semibold">Test Card</p>
                                            <p className="font-mono text-xs text-blue-300/80">4242 4242 4242 4242</p>
                                            <p className="font-sans text-[10px] text-blue-300/60">Any future date · Any CVC · Any ZIP</p>
                                        </div>
                                    </div>
                                )}
                                <Elements
                                    stripe={stripePromise}
                                    options={{
                                        clientSecret,
                                        appearance: STRIPE_APPEARANCE,
                                        locale: language === "ar" ? "ar" : "en",
                                    }}
                                >
                                    <PaymentForm
                                        email={email}
                                        setEmail={setEmail}
                                        totalPrice={totalPrice}
                                        language={language}
                                    />
                                </Elements>
                            </>
                        )}
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
