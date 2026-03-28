"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";

export default function CTASection() {
    const { language } = useLanguage();
    const tCta = translations.cta;
    const whatsappNumber = "971501234567"; // Placeholder number
    const whatsappMessage = encodeURIComponent(
        "السلام عليكم، أود الاستفسار عن العطور وإتمام طلبي."
    );
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    return (
        <section
            id="cta"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            className="relative py-28 px-6 overflow-hidden"
        >
            {/* Gold gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#C9A227] via-[#E5C84A] to-[#B8860B]" />

            {/* Shimmering overlay */}
            <div className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage:
                        "radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                }}
            />

            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(61,43,31,0.3) 10px, rgba(61,43,31,0.3) 11px)",
                }}
            />

            {/* Decorative corner ornaments */}
            <div className="absolute top-6 right-6 opacity-30">
                <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                    <path d="M50 0 L50 50 L0 50" stroke="#3D2B1F" strokeWidth="1" fill="none" />
                    <circle cx="45" cy="45" r="3" fill="#3D2B1F" />
                </svg>
            </div>
            <div className="absolute bottom-6 left-6 opacity-30 rotate-180">
                <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                    <path d="M50 0 L50 50 L0 50" stroke="#3D2B1F" strokeWidth="1" fill="none" />
                    <circle cx="45" cy="45" r="3" fill="#3D2B1F" />
                </svg>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto text-center">
                {/* Scarcity badge */}
                <div className="inline-flex items-center gap-3 mb-8">
                    <div className="w-2 h-2 rounded-full bg-[#3D2B1F] animate-pulse" />
                    <span className={language === 'ar' ? "font-arabic text-[#3D2B1F] text-sm font-semibold tracking-wider bg-[#3D2B1F]/10 px-5 py-1.5 rounded-full border border-[#3D2B1F]/20" : "font-sans uppercase text-[10px] md:text-xs text-[#3D2B1F] font-bold tracking-[0.2em] bg-[#3D2B1F]/10 px-5 py-1.5 rounded-full border border-[#3D2B1F]/20"}>
                        {tCta.limited[language]}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-[#3D2B1F] animate-pulse" />
                </div>

                {/* Main headline */}
                <h2 className={language === 'ar' ? "font-arabic text-5xl md:text-7xl font-bold text-[#3D2B1F] leading-tight mb-4" : "font-serif text-5xl md:text-7xl font-bold text-[#3D2B1F] leading-tight mb-4 tracking-wide"}>
                    {tCta.title[language]}
                </h2>

                {/* Sub headline */}
                <div className="flex items-center justify-center gap-4 mb-3">
                    <div className="h-px w-16 bg-[#3D2B1F]/30" />
                    <p className={language === 'ar' ? "font-arabic text-xl md:text-2xl text-[#3D2B1F]/80 font-light" : "font-sans uppercase text-xs md:text-sm tracking-[0.2em] text-[#3D2B1F]/80 font-semibold"}>
                        {tCta.subtitle[language]}
                    </p>
                    <div className="h-px w-16 bg-[#3D2B1F]/30" />
                </div>

                {/* Urgency text */}
                <p className={language === 'ar' ? "font-arabic text-[#3D2B1F]/70 text-base mb-12 font-light" : "font-sans text-[#3D2B1F]/80 text-sm mb-12 font-medium tracking-wide uppercase"}>
                    {tCta.shipping[language]}
                </p>

                {/* WhatsApp Button */}
                <motion.a
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    id="whatsapp-order-btn"
                    aria-label={language === "ar" ? "اطلب الآن عبر واتساب" : "Order now via WhatsApp"}
                    className="group inline-flex items-center gap-4 bg-[#3D2B1F] hover:bg-[#2A1810] text-[#E5C84A] px-10 py-5 rounded-full font-arabic font-bold text-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(61,43,31,0.5)]"
                >
                    {/* WhatsApp Icon */}
                    <svg
                        className="w-7 h-7 flex-shrink-0"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span className={language === 'ar' ? '' : 'font-sans uppercase text-sm tracking-widest'}>{tCta.whatsappBtn[language]}</span>
                    <svg
                        className={`w-5 h-5 transition-transform duration-300 ${language === 'ar' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d={language === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
                        />
                    </svg>
                </motion.a>

                <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
                    {tCta.badges.map((badge) => (
                        <div key={badge.icon} className="flex items-center gap-2">
                            <span className="text-lg">{badge.icon}</span>
                            <span className={language === 'ar' ? "font-arabic text-[#3D2B1F]/70 text-sm font-light" : "font-sans uppercase text-[10px] tracking-widest text-[#3D2B1F]/80 font-medium"}>
                                {badge.text[language]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section >
    );
}
