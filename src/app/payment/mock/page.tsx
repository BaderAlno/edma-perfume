"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { motion } from 'framer-motion';

function MockPaymentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { clearCart } = useCart();
    
    const [orderId, setOrderId] = useState<string | null>(null);
    const [orderNumber, setOrderNumber] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        setOrderId(searchParams.get('order_id'));
        setOrderNumber(searchParams.get('order_number'));
    }, [searchParams]);

    const handleConfirmPayment = async () => {
        setIsConfirming(true);

        // 4. Extract order_number from URL params inside the handler
        const currentOrderNumber = searchParams.get('order_number') || orderNumber || 'TEST-ORDER';
        const currentOrderId = searchParams.get('order_id') || orderId;

        // Simulate a short 1-second delay for the loading state as requested
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (currentOrderId) {
            // Attempt backend update silently
            fetch('/api/payment/mock-confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: currentOrderId })
            }).catch(() => console.warn("Backend update bypassed/failed silently."));
        }

        // 5. Clean up: forcefully empty cart
        try {
            clearCart();
        } catch (e) {
            console.error("clearCart error:", e);
        }

        // Redirect to success page
        const redirectUrl = `/thank-you?orderNumber=${encodeURIComponent(currentOrderNumber)}`;
        router.push(redirectUrl);
        
        // Failsafe in case router.push hangs in Next.js app router during dev
        setTimeout(() => {
            window.location.assign(redirectUrl);
        }, 600);
    };

    if (!orderId) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-[#D4AF37]/50 font-serif min-h-[400px]">
                <p>Missing Order Information.<br/>Cannot process mock payment.</p>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-[#16120E]/90 border border-[#D4AF37]/20 p-8 rounded-2xl shadow-2xl relative z-10 backdrop-blur-xl"
        >
            <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-serif tracking-[0.2em] text-[#D4AF37] mb-2 uppercase">EDMA Secure</h1>
                <p className="text-[#EBE5D9]/50 text-xs tracking-[0.3em] uppercase">Checkout (TEST MODE)</p>
            </div>

            <div className="space-y-6 mb-8">
                <div className="h-44 rounded-xl bg-gradient-to-br from-[#1F1915] to-[#0A0806] border border-[#D4AF37]/30 flex flex-col justify-between p-6 relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.1),transparent_50%)] pointer-events-none" />
                    
                    <div className="flex justify-between items-center text-[#D4AF37]/80">
                        <span className="font-mono text-[10px] tracking-widest uppercase">Test Card</span>
                        <svg className="w-8 h-8 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                        </svg>
                    </div>
                    
                    <div className="font-mono tracking-[0.15em] sm:tracking-[0.25em] text-[#EBE5D9] text-base sm:text-lg">
                        4111 •••• •••• 1111
                    </div>
                    
                    <div className="flex justify-between items-end text-[#EBE5D9]/60 text-xs font-mono">
                        <div className="flex flex-col">
                            <span className="text-[8px] tracking-widest uppercase text-[#D4AF37]/50 mb-1">Order</span>
                            <span>{orderNumber}</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[8px] tracking-widest uppercase text-[#D4AF37]/50 mb-1">Expires</span>
                            <span>12/99</span>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleConfirmPayment}
                disabled={isConfirming}
                className="relative w-full overflow-hidden bg-transparent border border-[#D4AF37] text-[#D4AF37] py-4 rounded group transition-all duration-500 hover:text-[#0A0806] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="absolute inset-0 bg-[#D4AF37] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 will-change-transform pointer-events-none z-0" />
                <span className="relative z-10 text-xs tracking-[0.2em] uppercase font-medium">
                    {isConfirming ? 'Processing Transaction...' : 'Confirm Test Payment'}
                </span>
            </button>
        </motion.div>
    );
}

export default function MockPaymentPage() {
    return (
        <main className="min-h-screen bg-[#080604] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Cinematic Background */}
            <div className="absolute inset-0 bg-[url('/bg-noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] bg-[#D4AF37]/5 blur-[100px] rounded-full pointer-events-none" />
            
            <Suspense fallback={<div className="text-[#D4AF37]/50">Loading Secure Environment...</div>}>
                <MockPaymentContent />
            </Suspense>
        </main>
    );
}
