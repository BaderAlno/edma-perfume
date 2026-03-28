"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

// ─── Shared input styles ──────────────────────────────────────────────────────
const inputBase =
    "w-full px-5 py-3.5 bg-[#0D0A07] text-[#EBE5D9] text-sm placeholder:text-[#3A2C20] outline-none transition-all duration-300 rounded-sm";

function borderStyle(focused: boolean, invalid?: boolean) {
    if (invalid)  return "1px solid rgba(239,68,68,0.55)";
    if (focused)  return "1px solid rgba(201,168,76,0.6)";
    return "1px solid rgba(201,168,76,0.15)";
}
function shadowStyle(focused: boolean, invalid?: boolean) {
    if (invalid)  return "0 0 0 3px rgba(239,68,68,0.07)";
    if (focused)  return "0 0 0 3px rgba(201,168,76,0.07), 0 0 16px rgba(201,168,76,0.08)";
    return "none";
}

// ─── Reusable text field ──────────────────────────────────────────────────────
function Field({
    id, type = "text", label, value, onChange,
    placeholder, autoComplete, invalid,
}: {
    id:           string;
    type?:        string;
    label:        string;
    value:        string;
    onChange:     (v: string) => void;
    placeholder:  string;
    autoComplete: string;
    invalid?:     boolean;
}) {
    const [focused, setFocused] = useState(false);
    return (
        <div className="flex flex-col gap-2">
            <label
                htmlFor={id}
                className="font-sans text-[10px] uppercase tracking-[0.25em] transition-colors duration-200"
                style={{ color: invalid ? "rgba(239,68,68,0.7)" : focused ? "#C9A84C" : "#8B7355" }}
            >
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                required
                dir="ltr"
                className={inputBase}
                style={{
                    border:    borderStyle(focused, invalid),
                    boxShadow: shadowStyle(focused, invalid),
                }}
            />
        </div>
    );
}

// ─── Password field with show/hide ────────────────────────────────────────────
function PasswordField({
    id, label, value, onChange, placeholder, autoComplete,
    showLabel, hideLabel, invalid, hint,
}: {
    id:           string;
    label:        string;
    value:        string;
    onChange:     (v: string) => void;
    placeholder:  string;
    autoComplete: string;
    showLabel:    string;
    hideLabel:    string;
    invalid?:     boolean;
    hint?:        React.ReactNode;
}) {
    const [focused, setFocused] = useState(false);
    const [show,    setShow]    = useState(false);
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <label
                    htmlFor={id}
                    className="font-sans text-[10px] uppercase tracking-[0.25em] transition-colors duration-200"
                    style={{ color: invalid ? "rgba(239,68,68,0.7)" : focused ? "#C9A84C" : "#8B7355" }}
                >
                    {label}
                </label>
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="font-sans text-[9px] uppercase tracking-widest text-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors duration-200"
                >
                    {show ? hideLabel : showLabel}
                </button>
            </div>
            <input
                id={id}
                type={show ? "text" : "password"}
                value={value}
                onChange={e => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                required
                dir="ltr"
                className={inputBase}
                style={{
                    border:    borderStyle(focused, invalid),
                    boxShadow: shadowStyle(focused, invalid),
                }}
            />
            {hint}
        </div>
    );
}

// ─── Password strength bar ────────────────────────────────────────────────────
function strengthScore(pw: string): 0 | 1 | 2 | 3 {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8)            s++;
    if (/[A-Z]/.test(pw))          s++;
    if (/[0-9!@#$%^&*]/.test(pw))  s++;
    return Math.min(s, 3) as 0 | 1 | 2 | 3;
}

const STRENGTH_COLORS = ["", "#ef4444", "#f59e0b", "#22c55e"] as const;
const STRENGTH_LABELS_EN = ["", "Weak", "Fair", "Strong"] as const;
const STRENGTH_LABELS_AR = ["", "ضعيفة", "متوسطة", "قوية"] as const;

function StrengthBar({ password, isAr }: { password: string; isAr: boolean }) {
    const score = strengthScore(password);
    if (!password) return null;
    return (
        <div className="flex items-center gap-2 mt-1">
            <div className="flex gap-1 flex-1">
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        className="h-[3px] flex-1 rounded-full transition-all duration-400"
                        style={{
                            background: i <= score ? STRENGTH_COLORS[score] : "rgba(201,168,76,0.1)",
                        }}
                    />
                ))}
            </div>
            <span
                className="font-sans text-[9px] uppercase tracking-widest transition-colors duration-300"
                style={{ color: STRENGTH_COLORS[score] }}
            >
                {isAr ? STRENGTH_LABELS_AR[score] : STRENGTH_LABELS_EN[score]}
            </span>
        </div>
    );
}

// ─── Match indicator ──────────────────────────────────────────────────────────
function MatchHint({ password, confirm, isAr }: { password: string; confirm: string; isAr: boolean }) {
    if (!confirm) return null;
    const matches = password === confirm;
    return (
        <p
            className="font-sans text-[9px] uppercase tracking-widest mt-1 transition-colors duration-200"
            style={{ color: matches ? "#22c55e" : "rgba(239,68,68,0.7)" }}
        >
            {matches
                ? (isAr ? "✓ كلمتا المرور متطابقتان" : "✓ Passwords match")
                : (isAr ? "كلمتا المرور غير متطابقتين" : "Passwords do not match")}
        </p>
    );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
    return (
        <svg className="w-4 h-4 animate-spin" style={{ animationDuration: "0.8s" }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(10,8,6,0.3)" strokeWidth="2.5" />
            <path d="M12 2 a10 10 0 0 1 10 10" stroke="#0A0806" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
    const { language } = useLanguage();
    const { register } = useAuth();
    const router = useRouter();
    const isAr = language === "ar";

    const [name,     setName]     = useState("");
    const [email,    setEmail]    = useState("");
    const [password, setPassword] = useState("");
    const [confirm,  setConfirm]  = useState("");
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState<string | null>(null);

    // Inline validation flags (only shown after a failed submit attempt)
    const [attempted, setAttempted] = useState(false);

    const pwMismatch = confirm.length > 0 && password !== confirm;
    const pwTooShort = password.length > 0 && password.length < 6;

    const canSubmit = name.trim() && email.trim() && password.length >= 6 && password === confirm;

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setAttempted(true);
        setError(null);

        if (!canSubmit) {
            if (password !== confirm) {
                setError(isAr ? "كلمتا المرور غير متطابقتين." : "Passwords do not match.");
            } else if (password.length < 6) {
                setError(isAr ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل." : "Password must be at least 6 characters.");
            }
            return;
        }

        setLoading(true);
        await new Promise(r => setTimeout(r, 800));
        register(name.trim(), email.trim(), password);
        setLoading(false);
        router.push("/");
    }, [name, email, password, confirm, canSubmit, register, router, isAr]);

    const t = {
        heading:      { en: "Create Account",            ar: "إنشاء حساب" },
        subheading:   { en: "Join the EDMA experience",  ar: "انضم إلى تجربة إدما" },
        nameLabel:    { en: "Full Name",                  ar: "الاسم الكامل" },
        namePh:       { en: "Your name",                  ar: "اسمك" },
        emailLabel:   { en: "Email Address",              ar: "البريد الإلكتروني" },
        emailPh:      { en: "your@email.com",             ar: "بريدك@مثال.com" },
        pwLabel:      { en: "Password",                   ar: "كلمة المرور" },
        pwPh:         { en: "Min. 6 characters",          ar: "٦ أحرف على الأقل" },
        confirmLabel: { en: "Confirm Password",           ar: "تأكيد كلمة المرور" },
        confirmPh:    { en: "Re-enter password",          ar: "أعد كتابة كلمة المرور" },
        submit:       { en: "Create Account",             ar: "إنشاء الحساب" },
        submitting:   { en: "Creating account…",          ar: "جارٍ الإنشاء…" },
        hasAccount:   { en: "Already have an account?",  ar: "لديك حساب بالفعل؟" },
        logIn:        { en: "Log in",                     ar: "تسجيل الدخول" },
        backToShop:   { en: "Back to shop",               ar: "العودة للمتجر" },
        show:         { en: "Show",                       ar: "إظهار" },
        hide:         { en: "Hide",                       ar: "إخفاء" },
    };

    return (
        <main
            className="min-h-screen bg-[#0A0806] flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
            dir={isAr ? "rtl" : "ltr"}
        >
            {/* ── Ambient glow ───────────────────────────────────────────── */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 20% 100%, rgba(201,168,76,0.04) 0%, transparent 60%)",
                }}
            />

            {/* ── Grid texture ───────────────────────────────────────────── */}
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
                className="relative z-10 w-full max-w-[420px] flex flex-col"
            >
                {/* ── Brand mark ─────────────────────────────────────────── */}
                <div className="flex flex-col items-center mb-10">
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
                    className="rounded-sm p-8 md:p-10 flex flex-col gap-6"
                    style={{
                        background: "linear-gradient(145deg, #110D0A, #0D0A07)",
                        border:     "1px solid rgba(201,168,76,0.12)",
                        boxShadow:  "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,168,76,0.06)",
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

                        {/* Full Name */}
                        <Field
                            id="name"
                            label={t.nameLabel[language]}
                            value={name}
                            onChange={setName}
                            placeholder={t.namePh[language]}
                            autoComplete="name"
                            invalid={attempted && !name.trim()}
                        />

                        {/* Email */}
                        <Field
                            id="email"
                            type="email"
                            label={t.emailLabel[language]}
                            value={email}
                            onChange={setEmail}
                            placeholder={t.emailPh[language]}
                            autoComplete="email"
                            invalid={attempted && !email.trim()}
                        />

                        {/* Password + strength bar */}
                        <PasswordField
                            id="password"
                            label={t.pwLabel[language]}
                            value={password}
                            onChange={v => { setPassword(v); if (error) setError(null); }}
                            placeholder={t.pwPh[language]}
                            autoComplete="new-password"
                            showLabel={t.show[language]}
                            hideLabel={t.hide[language]}
                            invalid={attempted && pwTooShort}
                            hint={<StrengthBar password={password} isAr={isAr} />}
                        />

                        {/* Confirm password + match hint */}
                        <PasswordField
                            id="confirm"
                            label={t.confirmLabel[language]}
                            value={confirm}
                            onChange={v => { setConfirm(v); if (error) setError(null); }}
                            placeholder={t.confirmPh[language]}
                            autoComplete="new-password"
                            showLabel={t.show[language]}
                            hideLabel={t.hide[language]}
                            invalid={attempted && pwMismatch}
                            hint={
                                <MatchHint
                                    password={password}
                                    confirm={confirm}
                                    isAr={isAr}
                                />
                            }
                        />

                        {/* Error banner */}
                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    key="err"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`${isAr ? "font-arabic text-sm" : "font-sans text-xs"} text-red-400/80 px-1 -mt-1`}
                                    role="alert"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="relative w-full py-4 rounded-sm overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(201,168,76,0.3)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none mt-1"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-[#C9A84C] via-[#E5C84A] to-[#C9A84C]" />
                            <span className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                            <span className="relative flex items-center justify-center gap-2.5">
                                {loading && <Spinner />}
                                <span className={`${isAr ? "font-arabic text-base font-medium" : "font-sans text-xs uppercase tracking-[0.2em] font-semibold"} text-[#0A0806]`}>
                                    {loading ? t.submitting[language] : t.submit[language]}
                                </span>
                            </span>
                        </button>
                    </form>

                    {/* Already have an account */}
                    <div className="flex justify-center pt-1">
                        <p className={`${isAr ? "font-arabic text-sm" : "font-sans text-[10px] uppercase tracking-wider"} text-[#8B7355] flex items-center gap-2`}>
                            {t.hasAccount[language]}
                            <Link
                                href="/login"
                                className="text-[#C9A84C] hover:text-[#E5C84A] transition-colors duration-200 underline underline-offset-2 decoration-[#C9A84C]/30"
                            >
                                {t.logIn[language]}
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to shop */}
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
