"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

// ─── Field component ──────────────────────────────────────────────────────────
function Field({
    id,
    type,
    label,
    value,
    onChange,
    placeholder,
    autoComplete,
    required,
}: {
    id:           string;
    type:         string;
    label:        string;
    value:        string;
    onChange:     (v: string) => void;
    placeholder:  string;
    autoComplete: string;
    required?:    boolean;
}) {
    const [focused, setFocused] = useState(false);

    return (
        <div className="flex flex-col gap-2">
            <label
                htmlFor={id}
                className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#8B7355] transition-colors duration-200"
                style={{ color: focused ? "#C9A84C" : undefined }}
            >
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    required={required}
                    dir="ltr"
                    className="w-full px-5 py-3.5 bg-[#0D0A07] text-[#EBE5D9] text-sm placeholder:text-[#3A2C20] outline-none transition-all duration-300 rounded-sm"
                    style={{
                        border: `1px solid ${focused ? "rgba(201,168,76,0.6)" : "rgba(201,168,76,0.15)"}`,
                        boxShadow: focused ? "0 0 0 3px rgba(201,168,76,0.07), 0 0 16px rgba(201,168,76,0.08)" : "none",
                    }}
                />
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
    const { language } = useLanguage();
    const { login } = useAuth();
    const router = useRouter();
    const isAr = language === "ar";

    const [email,    setEmail]    = useState("");
    const [password, setPassword] = useState("");
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState<string | null>(null);
    const [showPw,   setShowPw]   = useState(false);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        // Brief simulated delay for realistic feel
        await new Promise(r => setTimeout(r, 700));
        const ok = login(email.trim(), password);
        setLoading(false);
        if (ok) {
            router.push("/");
        } else {
            setError(
                isAr
                    ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
                    : "Invalid email or password."
            );
        }
    }, [email, password, login, router, isAr]);

    const t = {
        heading:        { en: "Welcome Back",             ar: "مرحباً بعودتك" },
        subheading:     { en: "Sign in to your account",  ar: "تسجيل الدخول إلى حسابك" },
        emailLabel:     { en: "Email Address",            ar: "البريد الإلكتروني" },
        emailPh:        { en: "your@email.com",           ar: "بريدك@مثال.com" },
        passwordLabel:  { en: "Password",                 ar: "كلمة المرور" },
        passwordPh:     { en: "••••••••",                 ar: "••••••••" },
        signIn:         { en: "Sign In",                  ar: "تسجيل الدخول" },
        signing:        { en: "Signing in…",              ar: "جارٍ الدخول…" },
        forgot:         { en: "Forgot your password?",    ar: "نسيت كلمة المرور؟" },
        noAccount:      { en: "Don't have an account?",   ar: "ليس لديك حساب؟" },
        createAccount:  { en: "Create one",               ar: "أنشئ حساباً" },
        backToShop:     { en: "Back to shop",             ar: "العودة للمتجر" },
        show:           { en: "Show",                     ar: "إظهار" },
        hide:           { en: "Hide",                     ar: "إخفاء" },
    };

    return (
        <main
            className="min-h-screen bg-[#0A0806] flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
            dir={isAr ? "rtl" : "ltr"}
        >
            {/* ── Ambient background glows ───────────────────────────────── */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 80% 100%, rgba(201,168,76,0.04) 0%, transparent 60%)",
                }}
            />

            {/* ── Subtle diagonal grid texture ───────────────────────────── */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(45deg, #D4AF37 0px, #D4AF37 1px, transparent 1px, transparent 24px)",
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[400px] flex flex-col"
            >
                {/* ── Brand mark ─────────────────────────────────────────── */}
                <div className="flex flex-col items-center mb-10">
                    {/* Ornamental top rule */}
                    <div className="flex items-center gap-3 mb-6 w-full max-w-[200px]">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
                        <div className="w-1 h-1 rounded-full bg-[#D4AF37]/60" />
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
                    </div>

                    <Link
                        href="/"
                        className="font-serif text-2xl tracking-[0.25em] text-white/90 hover:text-[#D4AF37] transition-colors duration-300 uppercase"
                    >
                        EDMA
                    </Link>
                    <p className="mt-1 font-sans text-[9px] uppercase tracking-[0.45em] text-[#D4AF37]/50">
                        Perfume
                    </p>
                </div>

                {/* ── Card ───────────────────────────────────────────────── */}
                <div
                    className="rounded-sm p-8 md:p-10 flex flex-col gap-7"
                    style={{
                        background: "linear-gradient(145deg, #110D0A, #0D0A07)",
                        border: "1px solid rgba(201,168,76,0.12)",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,168,76,0.06)",
                    }}
                >
                    {/* Heading */}
                    <div className="flex flex-col gap-1.5">
                        <h1 className={`${isAr ? "font-arabic text-2xl" : "font-serif text-2xl tracking-wide"} text-[#EBE5D9] font-light`}>
                            {t.heading[language]}
                        </h1>
                        <p className={`${isAr ? "font-arabic text-sm" : "font-sans text-xs uppercase tracking-widest"} text-[#8B7355]`}>
                            {t.subheading[language]}
                        </p>
                    </div>

                    {/* Thin gold divider */}
                    <div className="h-px bg-gradient-to-r from-[#D4AF37]/25 via-[#D4AF37]/10 to-transparent" />

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

                        <Field
                            id="email"
                            type="email"
                            label={t.emailLabel[language]}
                            value={email}
                            onChange={setEmail}
                            placeholder={t.emailPh[language]}
                            autoComplete="email"
                            required
                        />

                        {/* Password with show/hide toggle */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="password"
                                    className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#8B7355]"
                                >
                                    {t.passwordLabel[language]}
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPw(p => !p)}
                                    className="font-sans text-[9px] uppercase tracking-widest text-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors duration-200"
                                >
                                    {showPw ? t.hide[language] : t.show[language]}
                                </button>
                            </div>
                            <PasswordField
                                value={password}
                                onChange={setPassword}
                                show={showPw}
                                placeholder={t.passwordPh[language]}
                            />
                        </div>

                        {/* Error message */}
                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`${isAr ? "font-arabic text-sm" : "font-sans text-xs"} text-red-400/80 px-1`}
                                    role="alert"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="relative w-full py-4 rounded-sm overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(201,168,76,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none mt-1"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-[#C9A84C] via-[#E5C84A] to-[#C9A84C]" />
                            {/* Shimmer line */}
                            <span className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                            <span className="relative flex items-center justify-center gap-2.5">
                                {loading && (
                                    <svg className="w-4 h-4 animate-spin" style={{ animationDuration: "0.8s" }} viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="rgba(10,8,6,0.3)" strokeWidth="2.5" />
                                        <path d="M12 2 a10 10 0 0 1 10 10" stroke="#0A0806" strokeWidth="2.5" strokeLinecap="round" />
                                    </svg>
                                )}
                                <span className={`${isAr ? "font-arabic text-base font-medium" : "font-sans text-xs uppercase tracking-[0.2em] font-semibold"} text-[#0A0806]`}>
                                    {loading ? t.signing[language] : t.signIn[language]}
                                </span>
                            </span>
                        </button>
                    </form>

                    {/* Below-form links */}
                    <div className="flex flex-col items-center gap-3 pt-1">
                        <Link
                            href="/forgot-password"
                            className={`${isAr ? "font-arabic text-sm" : "font-sans text-[10px] uppercase tracking-widest"} text-[#8B7355] hover:text-[#C9A84C] transition-colors duration-200`}
                        >
                            {t.forgot[language]}
                        </Link>

                        <div className="h-px w-12 bg-[#D4AF37]/15" />

                        <p className={`${isAr ? "font-arabic text-sm" : "font-sans text-[10px] uppercase tracking-wider"} text-[#8B7355] flex items-center gap-2`}>
                            {t.noAccount[language]}
                            <Link
                                href="/register"
                                className="text-[#C9A84C] hover:text-[#E5C84A] transition-colors duration-200 underline underline-offset-2 decoration-[#C9A84C]/30"
                            >
                                {t.createAccount[language]}
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to shop link */}
                <div className="flex justify-center mt-8">
                    <Link
                        href="/shop"
                        className={`${isAr ? "font-arabic text-sm" : "font-sans text-[10px] uppercase tracking-widest"} text-[#5C4033] hover:text-[#8B7355] transition-colors duration-200 flex items-center gap-2`}
                    >
                        <svg className={`w-3 h-3 ${isAr ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        {t.backToShop[language]}
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}

// ─── Password field (isolated focus state) ────────────────────────────────────
function PasswordField({
    value, onChange, show, placeholder,
}: {
    value:       string;
    onChange:    (v: string) => void;
    show:        boolean;
    placeholder: string;
}) {
    const [focused, setFocused] = useState(false);

    return (
        <input
            id="password"
            type={show ? "text" : "password"}
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            autoComplete="current-password"
            required
            dir="ltr"
            className="w-full px-5 py-3.5 bg-[#0D0A07] text-[#EBE5D9] text-sm placeholder:text-[#3A2C20] outline-none transition-all duration-300 rounded-sm"
            style={{
                border: `1px solid ${focused ? "rgba(201,168,76,0.6)" : "rgba(201,168,76,0.15)"}`,
                boxShadow: focused ? "0 0 0 3px rgba(201,168,76,0.07), 0 0 16px rgba(201,168,76,0.08)" : "none",
            }}
        />
    );
}
