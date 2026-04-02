'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

function LoginForm() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const supabase     = getSupabaseBrowserClient();

    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [error,    setError]    = useState('');
    const [loading,  setLoading]  = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
            setLoading(false);
            return;
        }

        const next = searchParams.get('next') ?? '/admin/dashboard';
        router.push(next);
        router.refresh();
    }

    return (
        <div
            dir="rtl"
            className="min-h-screen flex items-center justify-center"
            style={{ background: '#0d0905' }}
        >
            {/* Ambient glow */}
            <div
                className="pointer-events-none fixed inset-0"
                style={{
                    background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(212,175,55,0.06) 0%, transparent 70%)',
                }}
            />

            <div className="w-full max-w-sm px-6 relative z-10">
                {/* Logo */}
                <div className="text-center mb-10">
                    <h1
                        className="font-serif text-5xl font-light tracking-[0.18em] mb-2"
                        style={{ color: '#D4AF37' }}
                    >
                        EDMA
                    </h1>
                    <p className="text-xs tracking-[0.3em] uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>
                        لوحة التحكم
                    </p>
                </div>

                {/* Card */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl p-8 space-y-5"
                    style={{
                        background:    '#120e08',
                        border:        '1px solid rgba(212,175,55,0.15)',
                        boxShadow:     '0 32px 80px rgba(0,0,0,0.6)',
                    }}
                >
                    <h2 className="text-lg font-light text-center mb-6" style={{ color: '#EBE5D9' }}>
                        تسجيل الدخول
                    </h2>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="block text-xs tracking-widest uppercase" style={{ color: 'rgba(212,175,55,0.6)' }}>
                            البريد الإلكتروني
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all duration-200"
                            style={{
                                background:   '#0d0905',
                                border:       '1px solid rgba(212,175,55,0.2)',
                                color:        '#EBE5D9',
                                direction:    'ltr',
                            }}
                            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.6)')}
                            onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)')}
                            placeholder="admin@edma.com"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label className="block text-xs tracking-widest uppercase" style={{ color: 'rgba(212,175,55,0.6)' }}>
                            كلمة المرور
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all duration-200"
                            style={{
                                background: '#0d0905',
                                border:     '1px solid rgba(212,175,55,0.2)',
                                color:      '#EBE5D9',
                                direction:  'ltr',
                            }}
                            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.6)')}
                            onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)')}
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-center rounded-lg py-2 px-3"
                            style={{ color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)' }}>
                            {error}
                        </p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-lg text-sm font-medium tracking-widest transition-all duration-200 disabled:opacity-50"
                        style={{
                            background: loading ? 'rgba(212,175,55,0.4)' : 'linear-gradient(135deg,#D4AF37,#B8960C)',
                            color:      '#0d0905',
                        }}
                    >
                        {loading ? '...' : 'دخول'}
                    </button>
                </form>

                <p className="text-center mt-6 text-xs" style={{ color: 'rgba(235,229,217,0.25)' }}>
                    EDMA Perfume ERP · {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}

export default function AdminLoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
