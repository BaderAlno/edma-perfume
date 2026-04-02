'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useCart } from "@/context/CartContext";

function ThankYouContent() {
    const params = useSearchParams();
    const { clearCart } = useCart();

    const orderNumber = params.get('order') ?? '';
    const method = params.get('method') ?? '';
    const error = params.get('error') ?? '';

    // Failsafe to clear cart (also handled in checkout, but good for Tap redirects)
    useEffect(() => {
        if (!error) {
            clearCart();
        }
    }, [error, clearCart]);

    if (error) {
        return (
            <div dir="rtl" className="min-h-screen flex items-center justify-center px-4 bg-[#0d0905]">
                <div className="relative z-10 w-full max-w-md rounded-2xl p-8 text-center space-y-6 bg-[#120e08] border border-red-500/20 shadow-2xl">
                    <div className="mx-auto flex flex-col items-center justify-center rounded-full w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-400">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-light mb-2 text-red-400">فشلت عملية الدفع</h1>
                        <p className="text-sm text-[#EBE5D9]/50">
                            {error === 'payment_failed' ? 'تم رفض البطاقة أو فشلت العملية من قبل البنك.' : 'حدث خطأ غير متوقع أثناء معالجة الدفع.'}
                        </p>
                    </div>
                    <a href="/checkout" className="w-full py-3.5 rounded-xl text-sm font-medium tracking-widest transition-all duration-150 inline-block bg-white/5 hover:bg-white/10 text-white border border-white/10">
                        المحاولة مرة أخرى
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div
            dir="rtl"
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: '#0d0905' }}
        >
            <div
                className="pointer-events-none fixed inset-0"
                style={{
                    background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(212,175,55,0.05) 0%, transparent 70%)',
                }}
            />

            <div
                className="relative z-10 w-full max-w-md rounded-2xl p-8 text-center space-y-6"
                style={{
                    background: '#120e08',
                    border: '1px solid rgba(212,175,55,0.12)',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
                }}
            >
                {/* Check icon */}
                <div
                    className="mx-auto flex items-center justify-center rounded-full"
                    style={{ width: 64, height: 64, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)' }}
                >
                    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>

                <p className="font-serif text-2xl tracking-[0.2em]" style={{ color: '#D4AF37' }}>EDMA</p>

                {/* Dynamic Heading & Body */}
                <div>
                    <h1 className="text-xl font-light mb-2" style={{ color: '#EBE5D9' }}>شكراً لك!</h1>

                    {method === 'bank_transfer' ? (
                        <p className="text-sm leading-relaxed text-[#EBE5D9]/70">
                            تم تسجيل طلبك. لتأكيده، يرجى <strong>تحويل المبلغ</strong> للحساب البنكي التالي:
                        </p>
                    ) : method === 'cash_on_delivery' ? (
                        <p className="text-sm leading-relaxed text-[#EBE5D9]/70">
                            تم تسجيل طلبك بنجاح! سيتم الدفع نقداً عند الاستلام. سنقوم بالتواصل معك لتأكيد الشحن قريباً.
                        </p>
                    ) : (
                        <p className="text-sm leading-relaxed text-[#EBE5D9]/70">
                            تم الدفع واستلام طلبك بنجاح. سيتم التواصل معك قريباً لتزويدك برقم التتبع.
                        </p>
                    )}
                </div>

                {/* Order Box & IBAN Block */}
                {orderNumber && (
                    <div className="rounded-xl p-5 text-right space-y-3" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.08)' }}>
                        <div className="flex justify-between items-center text-sm">
                            <span style={{ color: 'rgba(212,175,55,0.5)' }}>رقم الطلب</span>
                            <span style={{ color: '#EBE5D9' }} className="font-medium tabular-nums font-mono">#{orderNumber}</span>
                        </div>

                        {method === 'bank_transfer' && (
                            <div className="mt-4 pt-4 border-t border-[#C9A84C]/10 space-y-3 text-center">
                                <div>
                                    <p className="text-[#8B7355] text-xs mb-1">اسم البنك</p>
                                    <p className="text-[#EBE5D9] text-sm">مصرف الراجحي</p>
                                </div>
                                <div>
                                    <p className="text-[#8B7355] text-xs mb-1">الاسم</p>
                                    <p className="text-[#EBE5D9] text-sm">مؤسسة إدما للعطور</p>
                                </div>
                                <div className="bg-[#080604] p-3 rounded-lg border border-[#C9A84C]/10 mt-2">
                                    <p className="text-[#8B7355] text-xs mb-1">رقم الآيبان (IBAN)</p>
                                    <p className="text-[#C9A84C] text-sm font-mono tracking-wider break-all leading-tight">SA12 3456 7890 0000 0000 0000</p>
                                </div>
                                <p className="text-amber-500/80 text-[10px] uppercase tracking-wider mt-3">يرجى كتابة رقم الطلب في ملاحظة التحويل</p>
                            </div>
                        )}
                    </div>
                )}

                {/* CTA buttons */}
                <div className="flex flex-col gap-3 pt-2">
                    <a
                        href="/"
                        className="w-full py-3.5 rounded-xl text-sm font-medium tracking-widest transition-all duration-150 text-center block"
                        style={{
                            background: 'linear-gradient(135deg,#D4AF37,#B8960C)',
                            color: '#0d0905',
                        }}
                    >
                        العودة إلى المتجر
                    </a>
                    <p className="text-xs" style={{ color: 'rgba(235,229,217,0.25)' }}>
                        EDMA Perfume · {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function ThankYouPage() {
    return (
        <Suspense>
            <ThankYouContent />
        </Suspense>
    );
}
