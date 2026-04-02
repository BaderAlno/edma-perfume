"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";

export default function BrandStory() {
    const sectionRef = useRef<HTMLElement>(null);
    const { language } = useLanguage();
    const tBrand = translations.brandStory;

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const children = entry.target.querySelectorAll(".story-fade");
                        children.forEach((el, i) => {
                            setTimeout(() => {
                                (el as HTMLElement).style.opacity = "1";
                                (el as HTMLElement).style.transform = "translateY(0)";
                            }, i * 180);
                        });
                    }
                });
            },
            { threshold: 0.2 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section
            id="brand-story"
            ref={sectionRef}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            className="relative py-32 px-6 md:px-12 bg-[#F5EFE4] overflow-hidden"
        >
            {/* Soft abstract background */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#EDE3D0]/80 to-transparent" />
                <div className="absolute bottom-0 right-0 w-1/3 h-1/2 bg-gradient-to-tl from-[#D4AF37]/8 to-transparent" />
            </div>

            {/* Large decorative Arabic letter */}
            <div className={language === 'ar' ? "absolute right-0 top-1/2 -translate-y-1/2 font-arabic text-[20rem] text-[#D4AF37]/5 leading-none select-none pointer-events-none font-bold" : "absolute right-0 top-1/2 -translate-y-1/2 font-serif text-[20rem] text-[#D4AF37]/5 leading-none select-none pointer-events-none font-bold italic opacity-30"}>
                {language === 'ar' ? 'ع' : 'E'}
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Brand mark */}
                <div className="story-fade opacity-0 mb-12 flex items-center gap-4" style={{ transform: "translateY(20px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}>
                    <div className="w-px h-12 bg-gradient-to-b from-transparent via-[#D4AF37] to-transparent" />
                    <div>
                        <div className="text-[#D4AF37] text-xs tracking-[0.5em] uppercase font-light mb-1">
                            {tBrand.badge1[language]}
                        </div>
                        <div className={language === 'ar' ? "font-arabic text-[#8B7355] text-sm font-light" : "font-sans text-[#8B7355] text-[10px] md:text-xs uppercase tracking-widest font-light"}>
                            {tBrand.badge2[language]}
                        </div>
                    </div>
                </div>

                {/* Main story text */}
                <div className="space-y-6">
                    <p
                        className={language === 'ar' ? "story-fade opacity-0 font-arabic text-3xl md:text-5xl font-light text-[#3D2B1F] leading-relaxed" : "story-fade opacity-0 font-serif text-3xl md:text-5xl font-light text-[#3D2B1F] leading-relaxed"}
                        style={{ transform: "translateY(20px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}
                    >
                        {tBrand.atEdma[language]} <span className="text-[#C9A227] font-normal">{tBrand.atEdmaBrand[language]}</span>{tBrand.atEdmaComma[language]}
                    </p>

                    <p
                        className={language === 'ar' ? "story-fade opacity-0 font-arabic text-2xl md:text-4xl font-light text-[#3D2B1F] leading-loose" : "story-fade opacity-0 font-serif text-2xl md:text-4xl font-light text-[#3D2B1F] leading-loose"}
                        style={{ transform: "translateY(20px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}
                    >
                        {tBrand.notJust[language]}
                    </p>

                    <div
                        className="story-fade opacity-0 flex items-center gap-6 my-4"
                        style={{ transform: "translateY(20px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}
                    >
                        <div className={language === 'ar' ? "h-px flex-1 bg-gradient-to-r from-[#D4AF37]/50 to-transparent" : "h-px flex-1 bg-gradient-to-l from-[#D4AF37]/50 to-transparent"} />
                        <span className="text-[#D4AF37] text-xl">✦</span>
                        <div className={language === 'ar' ? "h-px w-16 bg-gradient-to-l from-[#D4AF37]/50 to-transparent" : "h-px w-16 bg-gradient-to-r from-[#D4AF37]/50 to-transparent"} />
                    </div>

                    <p
                        className={language === 'ar' ? "story-fade opacity-0 font-arabic text-xl md:text-2xl font-light text-[#5C4033] leading-relaxed" : "story-fade opacity-0 font-serif text-xl md:text-2xl font-light text-[#5C4033] leading-relaxed"}
                        style={{ transform: "translateY(20px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}
                    >
                        {tBrand.butIdentity[language]}
                        <span className="text-[#3D2B1F] font-medium">{tBrand.identityWord[language]}</span>
                        {language === 'ar' ? '،' : ', '}
                        <span className="text-[#3D2B1F] font-medium">{tBrand.presenceWord[language]}</span>
                        <br />
                        {tBrand.andImpression[language]}
                        <span className="italic text-[#C9A227]">{tBrand.unforgettable[language]}</span>
                        {tBrand.impressionEnd[language]}
                    </p>

                    <div
                        className="story-fade opacity-0 pt-4"
                        style={{ transform: "translateY(20px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}
                    >
                        {/* Decorative line with ornament */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-px w-10 bg-[#D4AF37]/60" />
                            <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                            <div className="h-px w-10 bg-[#D4AF37]/60" />
                        </div>
                        <p className={language === 'ar' ? "font-arabic text-base md:text-lg text-[#8B7355] leading-relaxed font-light max-w-lg mb-8" : "font-sans text-sm md:text-base text-[#8B7355] leading-relaxed font-light max-w-lg mb-8 tracking-wide"}>
                            {tBrand.craft[language]}
                        </p>

                        <Link
                            href="/shop"
                            className={language === 'ar' ? "inline-block px-8 py-3 bg-[#3D2B1F] text-[#F5EFE4] rounded-full font-arabic text-sm hover:bg-[#8B7355] transition-colors shadow-md hover:shadow-lg" : "inline-block px-8 py-3 bg-[#3D2B1F] text-[#F5EFE4] rounded-full font-sans uppercase tracking-widest text-xs hover:bg-[#8B7355] transition-colors shadow-md hover:shadow-lg"}
                        >
                            {tBrand.shopCollection[language]}
                        </Link>
                    </div>
                </div>

                {/* Bottom signature */}
                <div
                    className="story-fade opacity-0 mt-16 pt-10 border-t border-[#D4AF37]/20"
                    style={{ transform: "translateY(20px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}
                >
                    <div className={language === 'ar' ? "flex items-end justify-between" : "flex items-end justify-between flex-row-reverse"}>
                        <div>
                            <p className={language === 'ar' ? "font-arabic text-xs text-[#8B7355]/60 mb-2 tracking-wide" : "font-sans uppercase text-[10px] tracking-widest text-[#8B7355]/70 mb-2"}>
                                {tBrand.passionSince[language]}
                            </p>
                            <p className="font-serif text-[#D4AF37] text-2xl tracking-widest">
                                MMXXII
                            </p>
                        </div>
                        <div className={language === 'ar' ? "text-left" : "text-right"}>
                            <p className={language === 'ar' ? "font-arabic text-xs text-[#8B7355]/60 mb-1" : "font-sans uppercase text-[10px] tracking-widest text-[#8B7355]/70 mb-1"}>
                                {tBrand.madeIn[language]}
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-px bg-[#D4AF37]/50" />
                                <span className="text-[#D4AF37]/60 text-xs tracking-wider">
                                    KWT
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
