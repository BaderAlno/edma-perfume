"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

// ─── Stripe singleton ─────────────────────────────────────────────────────────
const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

// ─── Gold spinner ─────────────────────────────────────────────────────────────
function GoldSpinner() {
    return (
        <svg width="40" height="40" viewBox="0 0 24 24" className="animate-spin" style={{ animationDuration: "0.9s" }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth="2" />
            <path d="M12 2 a10 10 0 0 1 10 10" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

// ─── Animated checkmark ───────────────────────────────────────────────────────
function SuccessCheck() {
    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
            className="w-20 h-20 mx-auto rounded-full border-2 border-[#C9A84C]/60 flex items-center justify-center relative"
        >
            {/* Radial glow */}
            <div className="absolute inset-0 rounded-full bg-[#C9A84C]/10 blur-md" />
            <motion.svg
                className="w-8 h-8 text-[#C9A84C] relative z-10"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
            >
                <motion.path
                    strokeLinecap="round" strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
                />
            </motion.svg>
        </motion.div>
    );
}

// ─── Status types ─────────────────────────────────────────────────────────────
type Status = "verifying" | "sending_email" | "done" | "failed";

// ─── Inner component (uses useSearchParams, must be in Suspense) ──────────────
function SuccessContent() {
    const searchParams = useSearchParams();
    const router       = useRouter();
    const { language } = useLanguage();
    const { items, clearCart } = useCart();
    const isAr = language === "ar";

    const [status,   setStatus]   = useState<Status>("verifying");
    const [orderRef, setOrderRef] = useState<string | null>(null);
    const processedRef = useRef(false);

    const clientSecret = searchParams.get("payment_intent_client_secret");
    const redirectStatus = searchParams.get("redirect_status");

    useEffect(() => {
        if (processedRef.current) return;
        processedRef.current = true;

        // Mock bypass — skip Stripe verification entirely
        if (clientSecret?.startsWith("pi_mock_")) {
            const piId = searchParams.get("payment_intent") ?? `mock_${Date.now()}`;
            setOrderRef(piId.slice(-8).toUpperCase());
            handlePostPayment(clientSecret, piId);
            return;
        }

        // Stripe passes redirect_status directly — fast-path for success
        if (redirectStatus === "succeeded" && clientSecret) {
            const piId = searchParams.get("payment_intent");
            if (piId) setOrderRef(piId.slice(-8).toUpperCase()); // last 8 chars as readable ref
            handlePostPayment(clientSecret, piId ?? "");
        } else if (redirectStatus && redirectStatus !== "succeeded") {
            setStatus("failed");
        } else {
            // Fallback: verify via Stripe.js (uses publishable key — safe client-side)
            verifyViaStripeJs(clientSecret ?? "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function verifyViaStripeJs(secret: string) {
        if (!secret) { setStatus("failed"); return; }
        try {
            const stripe = await stripePromise;
            if (!stripe) { setStatus("failed"); return; }
            const { paymentIntent } = await stripe.retrievePaymentIntent(secret);
            if (paymentIntent?.status === "succeeded") {
                setOrderRef(paymentIntent.id.slice(-8).toUpperCase());
                await handlePostPayment(secret, paymentIntent.id);
            } else {
                setStatus("failed");
            }
        } catch {
            setStatus("failed");
        }
    }

    async function handlePostPayment(secret: string, piId: string) {
        // Clear the cart immediately — payment is confirmed
        clearCart();

        // Retrieve checkout data from sessionStorage
        let email    = "";
        let ssItems: { id: string; quantity: number }[] = [];
        let ssLang: "en" | "ar" = language;
        try {
            email   = sessionStorage.getItem("edma-checkout-email")    ?? "";
            ssItems = JSON.parse(sessionStorage.getItem("edma-checkout-items")    ?? "[]");
            const sl = sessionStorage.getItem("edma-checkout-language");
            if (sl === "en" || sl === "ar") ssLang = sl;
        } catch { /* ignore */ }

        // If no session data, fall back to cart items (already cleared, so use the snapshot)
        const orderItems = ssItems.length
            ? ssItems
            : items.map(i => ({ id: i.id, quantity: i.quantity }));

        if (email && orderItems.length) {
            setStatus("sending_email");
            try {
                const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/Edma-Perf";
                await fetch(`${basePath}/api/send-email`, {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email,
                        items:    orderItems,
                        language: ssLang,
                        orderRef: piId,
                    }),
                });
                // Clean up sessionStorage
                sessionStorage.removeItem("edma-checkout-email");
                sessionStorage.removeItem("edma-checkout-items");
                sessionStorage.removeItem("edma-checkout-language");
            } catch { /* email failed silently — order is still confirmed */ }
        }

        setStatus("done");
    }

    // ── Failed state ───────────────────────────────────────────────────────
    if (status === "failed") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-6 text-center"
            >
                <div className="w-16 h-16 rounded-full border border-red-500/40 flex items-center justify-center text-red-400">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <div>
                    <p className={`${isAr ? "font-arabic text-xl" : "font-serif text-xl"} text-[#EBE5D9] mb-2`}>
                        {isAr ? "لم تكتمل عملية الدفع" : "Payment not completed"}
                    </p>
                    <p className={`${isAr ? "font-arabic text-sm" : "font-sans text-sm"} text-[#8B7355]`}>
                        {isAr ? "يرجى المحاولة مرة أخرى" : "Please try again"}
                    </p>
                </div>
                <button
                    onClick={() => router.push("/checkout")}
                    className={`${isAr ? "font-arabic text-sm" : "font-sans text-xs uppercase tracking-wider"} px-8 py-3 rounded-full border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors`}
                >
                    {isAr ? "العودة إلى الدفع" : "Return to Checkout"}
                </button>
            </motion.div>
        );
    }

    // ── Verifying / sending email loading state ────────────────────────────
    if (status === "verifying" || status === "sending_email") {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-5 text-center py-8"
            >
                <GoldSpinner />
                <p className={`${isAr ? "font-arabic text-base" : "font-sans text-sm"} text-[#8B7355]`}>
                    {status === "verifying"
                        ? (isAr ? "جارٍ التحقق من الدفع..." : "Verifying payment...")
                        : (isAr ? "جارٍ إرسال تأكيد الطلب..." : "Sending order confirmation...")}
                </p>
            </motion.div>
        );
    }

    // ── Success state ──────────────────────────────────────────────────────
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-8 text-center"
        >
            <SuccessCheck />

            {/* Headline */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-col gap-3"
            >
                <h1 className={`${isAr ? "font-arabic text-3xl md:text-4xl" : "font-serif text-3xl md:text-4xl"} font-light text-[#EBE5D9] tracking-wide`}>
                    {isAr ? "شكراً لاختيارك إدما" : "Thank you for choosing Edma"}
                </h1>
                <p className={`${isAr ? "font-arabic text-base" : "font-sans text-sm"} text-[#8B7355] leading-relaxed max-w-md mx-auto`}>
                    {isAr
                        ? "لقد تلقينا طلبك بنجاح. ستصلك رسالة تأكيد على بريدك الإلكتروني قريباً."
                        : "Your order has been received. A confirmation email is on its way."}
                </p>
            </motion.div>

            {/* Gold divider */}
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="w-24 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/60 to-transparent"
            />

            {/* Order reference */}
            {orderRef && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="px-6 py-4 rounded-xl bg-[#1A0E08] border border-[#C9A84C]/15 flex flex-col gap-1"
                >
                    <span className={`${isAr ? "font-arabic text-xs" : "font-sans text-[10px] uppercase tracking-[0.25em]"} text-[#8B7355]`}>
                        {isAr ? "رقم الطلب" : "Order Reference"}
                    </span>
                    <span className="font-mono text-sm text-[#C9A84C] tracking-widest">
                        #{orderRef}
                    </span>
                </motion.div>
            )}

            {/* Tagline */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="font-serif text-sm text-[#C9A84C]/50 italic tracking-wider"
            >
                {isAr ? "أناقة خفية. حضور لا يُنسى." : "Invisible elegance. Unforgettable presence."}
            </motion.p>

            {/* Action buttons */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="flex flex-col sm:flex-row gap-4 w-full max-w-xs"
            >
                <Link
                    href="/"
                    className={`flex-1 text-center py-3.5 rounded-full relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(201,168,76,0.3)] ${isAr ? "font-arabic text-sm" : "font-sans text-xs uppercase tracking-[0.15em] font-semibold"} text-[#0D0A07]`}
                    style={{ background: "linear-gradient(135deg, #C9A84C, #E5C84A)" }}
                >
                    <span className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    {isAr ? "متابعة التسوق" : "Continue Shopping"}
                </Link>

                <Link
                    href="/shop"
                    className={`flex-1 text-center py-3.5 rounded-full border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors duration-300 ${isAr ? "font-arabic text-sm" : "font-sans text-xs uppercase tracking-[0.15em]"}`}
                >
                    {isAr ? "تصفح المجموعة" : "Browse Collection"}
                </Link>
            </motion.div>
        </motion.div>
    );
}

// ─── Page shell (wraps in Suspense for useSearchParams) ──────────────────────
export default function SuccessPage() {
    const { language } = useLanguage();
    const isAr = language === "ar";

    return (
        <main
            className="min-h-screen bg-[#0A0806] text-[#EBE5D9] flex flex-col"
            dir={isAr ? "rtl" : "ltr"}
        >
            {/* Decorative radial glow at top */}
            <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_50%_0%,_rgba(201,168,76,0.07)_0%,_transparent_60%)] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 border-b border-[#C9A84C]/10 px-6 py-5 text-center">
                <span className="text-[#C9A84C]/60 text-[10px] tracking-[0.5em] font-sans uppercase">
                    E &nbsp; D &nbsp; M &nbsp; A
                </span>
            </div>

            {/* Card */}
            <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-md bg-[#0D0A07] border border-[#C9A84C]/10 rounded-2xl p-8 md:p-12 shadow-[0_0_80px_rgba(0,0,0,0.6)]">
                    <Suspense
                        fallback={
                            <div className="flex flex-col items-center gap-5 py-8">
                                <svg width="36" height="36" viewBox="0 0 24 24" className="animate-spin" style={{ animationDuration: "0.9s" }}>
                                    <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth="2" />
                                    <path d="M12 2 a10 10 0 0 1 10 10" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                        }
                    >
                        <SuccessContent />
                    </Suspense>
                </div>
            </div>
        </main>
    );
}
