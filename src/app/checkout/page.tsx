"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";

const PAYMENT_METHODS = [
    { id: "tap", title: "البطاقة الائتمانية / مدى / KNET", titleEn: "Credit Card / mada / KNET", icon: "💳" },
    { id: "apple_pay", title: "Apple Pay", titleEn: "Apple Pay", icon: "🍎" },
    { id: "bank_transfer", title: "تحويل بنكي", titleEn: "Bank Transfer", icon: "🏦" },
    { id: "cash_on_delivery", title: "الدفع عند الاستلام (COD)", titleEn: "Cash on Delivery (COD)", icon: "💵" }
];

export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalPrice, clearCart } = useCart();
    const { language } = useLanguage();
    const { formatPrice } = useCurrency();
    const isAr = language === "ar";

    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [method, setMethod] = useState("tap");
    const [isProcessing, setIsProcessing] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [failCount, setFailCount] = useState(0);

    // Mock coupon logic for visual parity
    const discountAmount = 0;
    const finalTotal = Math.max(0, totalPrice - discountAmount);

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setGlobalError(null);
        setIsProcessing(true);

        try {
            // 1. Create Order
            const orderRes = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: items.map(i => ({ id: i.id, quantity: i.quantity, price_sar: i.price_sar })),
                    payment_method: method,
                    customer: { name, phone, email },
                    source: "website"
                })
            });

            const orderData = await orderRes.json();

            if (!orderRes.ok || orderData.error) {
                throw new Error(orderData.error || "Failed to create order");
            }

            const { order_id, order_number, redirect_url } = orderData;

            // MOCK GATEWAY REDIRECT
            if (redirect_url) {
                // Normally clearCart happens in success flow, but mock payment handles clear in UI
                router.push(redirect_url);
                return;
            }

            // 2. Routing based on gateway
            if (method === "cash_on_delivery" || method === "bank_transfer") {
                clearCart();
                router.push(`/thank-you?order=${order_number}&method=${method}`);
                return; // halt and redirect
            }

            // 3. Init Tap Charge
            const tapRes = await fetch("/api/payment/tap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_id,
                    total_amount: finalTotal,
                    customer_name: name,
                    customer_email: email,
                    customer_phone: phone,
                    payment_type: method
                })
            });

            const tapData = await tapRes.json();

            if (!tapRes.ok || tapData.error) {
                throw new Error(tapData.error || "Failed to initialize payment gateway");
            }

            // Redirect to Tap
            clearCart();
            window.location.href = tapData.url;

        } catch (err: any) {
            setGlobalError(err.message || "An unexpected error occurred.");
            setFailCount(prev => prev + 1);
            setIsProcessing(false);
        }
    };

    const handleForceClearCart = () => {
        clearCart();
        window.location.reload();
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen py-32 flex flex-col items-center justify-center text-center" dir={isAr ? "rtl" : "ltr"}>
                <p className="text-[#C9A84C] text-xl mb-4">{isAr ? "السلة فارغة" : "Cart is empty"}</p>
                <button onClick={() => router.push('/shop')} className="text-[#EBE5D9] opacity-70 hover:opacity-100 underline">
                    {isAr ? "العودة للتسوق" : "Return to Shop"}
                </button>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#080604] py-24 md:py-32 outline-none" dir={isAr ? "rtl" : "ltr"}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className={`${isAr ? 'font-arabic font-light' : 'font-serif'} text-4xl text-[#EBE5D9] mb-3 tracking-wide`}>
                        {isAr ? 'إتمام الطلب' : 'Checkout'}
                    </h1>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#C9A84C]/50" />
                        <span className="font-serif text-[#C9A84C] text-sm tracking-[0.2em]">EDMA SECURE</span>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#C9A84C]/50" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-8 lg:gap-16">
                    {/* LEFT: Order Summary */}
                    <motion.div initial={{ opacity: 0, x: isAr ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className="p-6 md:p-8 rounded-2xl border border-[#C9A84C]/10 bg-[#0D0A07]/50 self-start">
                        <h2 className={`text-[#C9A84C]/70 mb-6 ${isAr ? "font-arabic text-sm" : "font-sans text-[10px] uppercase tracking-[0.3em]"}`}>
                            {isAr ? "ملخص الطلب" : "Order Summary"}
                        </h2>
                        <ul className="flex flex-col gap-4 mb-6">
                            {items.map(item => (
                                <li key={item.id} className="flex items-center gap-4">
                                    <div className="relative w-14 h-14 bg-white/5 border border-[#C9A84C]/20 rounded-lg overflow-hidden flex-shrink-0">
                                        <Image src={item.image} alt={item.name[language]} fill sizes="56px" className="object-contain p-1.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[#EBE5D9] font-light truncate">{item.name[language]}</p>
                                        <p className="text-[#8B7355] text-xs">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="text-[#C9A84C] text-sm tabular-nums flex-shrink-0">
                                        {formatPrice(item.price_sar * item.quantity)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                        <div className="h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent mb-6" />
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[#EBE5D9]/50 text-sm">{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
                            <span className="text-[#EBE5D9] tabular-nums">{formatPrice(totalPrice)}</span>
                        </div>
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-[#EBE5D9]/50 text-sm">{isAr ? "التوصيل" : "Shipping"}</span>
                            <span className="text-green-400 text-sm">{isAr ? "مجانًا" : "Free"}</span>
                        </div>
                        <div className="flex justify-between items-end pt-4 border-t border-[#C9A84C]/20">
                            <span className="text-[#C9A84C] font-semibold">{isAr ? "الإجمالي" : "Total"}</span>
                            <span className="text-[#C9A84C] font-semibold text-lg tabular-nums">
                                {formatPrice(finalTotal)}
                            </span>
                        </div>
                    </motion.div>

                    {/* RIGHT: Payment Form */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 md:p-8 rounded-2xl border border-[#C9A84C]/10 bg-[#0D0A07] self-start">
                        <form onSubmit={handleCheckout} className="flex flex-col gap-8">
                            {globalError && (
                                <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex flex-col gap-2">
                                    <p>{globalError}</p>
                                    <button
                                        type="button"
                                        onClick={() => { clearCart(); router.push('/shop'); }}
                                        className="self-start mt-1 text-xs px-4 py-2 bg-[#C9A84C]/20 hover:bg-[#C9A84C]/30 text-[#C9A84C] rounded transition-colors"
                                    >
                                        تحديث السلة وتصحيح البيانات
                                    </button>
                                    {failCount >= 2 && (
                                        <button
                                            type="button"
                                            onClick={handleForceClearCart}
                                            className="self-start text-xs px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded transition-colors"
                                        >
                                            {isAr ? "إفراغ السلة وتحديث الصفحة" : "Force Clear Cart & Refresh"}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Section 1: Customer Details */}
                            <div>
                                <h3 className={`text-[#C9A84C]/70 mb-5 ${isAr ? "font-arabic text-sm" : "font-sans text-[10px] uppercase tracking-[0.3em]"}`}>
                                    {isAr ? "بيانات العميل" : "Customer Details"}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className={`text-[#8B7355] ${isAr ? "font-arabic text-xs" : "font-sans text-[10px] uppercase tracking-[0.2em]"}`}>{isAr ? "الاسم الكامل" : "Full Name"}</label>
                                        <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full px-4 py-3 rounded-lg bg-[#120E0A] border border-[#C9A84C]/20 text-[#EBE5D9] text-sm focus:outline-none focus:border-[#C9A84C]/60" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className={`text-[#8B7355] ${isAr ? "font-arabic text-xs" : "font-sans text-[10px] uppercase tracking-[0.2em]"}`}>{isAr ? "رقم الهاتف" : "Phone"}</label>
                                        <input required value={phone} onChange={e => setPhone(e.target.value)} type="tel" dir="ltr" className="w-full px-4 py-3 rounded-lg bg-[#120E0A] border border-[#C9A84C]/20 text-[#EBE5D9] text-sm focus:outline-none focus:border-[#C9A84C]/60" />
                                    </div>
                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className={`text-[#8B7355] ${isAr ? "font-arabic text-xs" : "font-sans text-[10px] uppercase tracking-[0.2em]"}`}>{isAr ? "البريد الإلكتروني" : "Email"}</label>
                                        <input required value={email} onChange={e => setEmail(e.target.value)} type="email" dir="ltr" className="w-full px-4 py-3 rounded-lg bg-[#120E0A] border border-[#C9A84C]/20 text-[#EBE5D9] text-sm focus:outline-none focus:border-[#C9A84C]/60" />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Payment Method */}
                            <div>
                                <h3 className={`text-[#C9A84C]/70 mb-5 ${isAr ? "font-arabic text-sm" : "font-sans text-[10px] uppercase tracking-[0.3em]"}`}>
                                    {isAr ? "طريقة الدفع" : "Payment Method"}
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {PAYMENT_METHODS.map(pm => {
                                        const isSelected = method === pm.id;
                                        return (
                                            <button
                                                key={pm.id}
                                                type="button"
                                                onClick={() => setMethod(pm.id)}
                                                className={`relative w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-300 overflow-hidden ${isSelected
                                                    ? 'bg-[#C9A84C]/10 border-[#C9A84C] shadow-[0_0_15px_rgba(201,168,76,0.1)]'
                                                    : 'bg-[#120E0A] border-[#C9A84C]/10 hover:border-[#C9A84C]/30 opacity-70 hover:opacity-100'
                                                    }`}
                                            >
                                                {isSelected && <motion.div layoutId="payBg" className="absolute inset-0 bg-gradient-to-r from-[#C9A84C]/5 to-transparent pointer-events-none" />}

                                                <div className="relative text-2xl flex-shrink-0 w-8 text-center">{pm.icon}</div>
                                                <div className="relative flex-1 text-right md:text-start" dir={isAr ? "rtl" : "ltr"}>
                                                    <span className={`block font-medium ${isAr ? 'font-arabic text-sm' : 'text-sm'} ${isSelected ? 'text-[#C9A84C]' : 'text-[#EBE5D9]'}`}>
                                                        {isAr ? pm.title : pm.titleEn}
                                                    </span>
                                                </div>

                                                {/* Custom Radio Circle */}
                                                <div className={`relative w-5 h-5 rounded-full border flex flex-shrink-0 items-center justify-center transition-colors ${isSelected ? 'border-[#C9A84C]' : 'border-[#8B7355]/50'
                                                    }`}>
                                                    {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 rounded-full bg-[#C9A84C]" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="relative w-full py-4 rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-[#C9A84C] via-[#E5C84A] to-[#C9A84C]" />
                                <span className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                                <span className="relative flex items-center justify-center gap-3">
                                    {isProcessing ? (
                                        <svg className="animate-spin h-5 w-5 text-[#0D0A07]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12A8 8 0 018 4V0A12 12 0 000 12h4zm2 5.291a7.962 7.962 0 01-2-5.291H0a11.962 11.962 0 003 9.09l1-3.799z"></path></svg>
                                    ) : (
                                        <span className={`${isAr ? "font-arabic text-base" : "font-sans text-xs uppercase tracking-[0.15em]"} text-[#0D0A07] font-semibold`}>
                                            {isAr ? "تأكيد الطلب والدفع" : "Confirm Order & Pay"}
                                        </span>
                                    )}
                                </span>
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
