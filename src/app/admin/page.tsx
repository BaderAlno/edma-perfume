"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const ADMIN_PASSWORD = "Edma2026";
const AUTH_KEY       = "edma-admin-auth";

function GoldSpinner() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" className="animate-spin" style={{ animationDuration: "0.8s" }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="2.5" />
            <path d="M12 2 a10 10 0 0 1 10 10" fill="none" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

export default function AdminLoginPage() {
    const router = useRouter();
    const [password,  setPassword]  = useState("");
    const [error,     setError]     = useState(false);
    const [loading,   setLoading]   = useState(false);
    const [checking,  setChecking]  = useState(true);

    // Redirect if already authenticated
    useEffect(() => {
        if (sessionStorage.getItem(AUTH_KEY) === "true") {
            router.replace("/admin/dashboard");
        } else {
            setChecking(false);
        }
    }, [router]);

    if (checking) return null;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        // Slight delay for UX
        setTimeout(() => {
            if (password === ADMIN_PASSWORD) {
                sessionStorage.setItem(AUTH_KEY, "true");
                router.push("/admin/dashboard");
            } else {
                setError(true);
                setLoading(false);
                setPassword("");
                setTimeout(() => setError(false), 3200);
            }
        }, 700);
    }

    return (
        <main className="min-h-screen bg-[#0A0806] flex flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,_rgba(201,168,76,0.06)_0%,_transparent_60%)] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-sm"
            >
                {/* Brand */}
                <div className="flex items-center justify-center gap-3 mb-10">
                    <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#C9A84C]/40" />
                    <span className="font-serif text-2xl text-[#EBE5D9] tracking-[0.3em] font-light">EDMA</span>
                    <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#C9A84C]/40" />
                </div>

                <div className="bg-[#0D0A07] border border-[#C9A84C]/10 rounded-2xl p-8 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
                    {/* Header */}
                    <div className="mb-7 text-center">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full border border-[#C9A84C]/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-[#C9A84C]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="font-serif text-xl text-[#EBE5D9] font-light tracking-wider">Admin Access</h1>
                        <p className="font-sans text-xs text-[#8B7355] mt-1 tracking-wider">Enter your password to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Password field */}
                        <div className="flex flex-col gap-2">
                            <label className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#8B7355]">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoFocus
                                required
                                className="w-full px-4 py-3 rounded-lg bg-[#0A0806] border border-[#C9A84C]/15 text-[#EBE5D9] text-sm placeholder:text-[#3D2B1F] focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/15 transition-colors duration-200"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Error message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400"
                                >
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span className="font-sans text-xs">Incorrect password. Please try again.</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={!password || loading}
                            className="relative w-full py-3.5 mt-1 rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(201,168,76,0.25)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-[#C9A84C] via-[#E5C84A] to-[#C9A84C]" />
                            <span className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                            <span className="relative flex items-center justify-center gap-2.5">
                                {loading && <GoldSpinner />}
                                <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-[#0D0A07] font-semibold">
                                    {loading ? "Verifying..." : "Enter Dashboard"}
                                </span>
                            </span>
                        </button>
                    </form>
                </div>

                <p className="text-center font-sans text-[10px] text-[#3D2B1F] mt-6 tracking-wider">
                    EDMA Admin · Restricted Access
                </p>
            </motion.div>
        </main>
    );
}
