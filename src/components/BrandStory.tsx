"use client";

import { useEffect, useRef } from "react";

export default function BrandStory() {
    const sectionRef = useRef<HTMLElement>(null);

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
            dir="rtl"
            className="relative py-32 px-6 md:px-12 bg-[#F5EFE4] overflow-hidden"
        >
            {/* Soft abstract background */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#EDE3D0]/80 to-transparent" />
                <div className="absolute bottom-0 right-0 w-1/3 h-1/2 bg-gradient-to-tl from-[#D4AF37]/8 to-transparent" />
            </div>

            {/* Large decorative Arabic letter */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 font-arabic text-[20rem] text-[#D4AF37]/5 leading-none select-none pointer-events-none font-bold">
                ع
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Brand mark */}
                <div className="story-fade opacity-0 mb-12 flex items-center gap-4" style={{ transform: "translateY(20px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}>
                    <div className="w-px h-12 bg-gradient-to-b from-transparent via-[#D4AF37] to-transparent" />
                    <div>
                        <div className="text-[#D4AF37] text-xs tracking-[0.5em] uppercase font-light mb-1">
                            EDMA PERFUME
                        </div>
                        <div className="font-arabic text-[#8B7355] text-sm font-light">
                            حكايتنا
                        </div>
                    </div>
                </div>

                {/* Main story text */}
                <div className="space-y-6">
                    <p
                        className="story-fade opacity-0 font-arabic text-3xl md:text-5xl font-light text-[#3D2B1F] leading-relaxed"
                        style={{ transform: "translateY(20px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}
                    >
                        في <span className="text-[#C9A227] font-normal">EDMA</span>،
                    </p>

                    <p
                        className="story-fade opacity-0 font-arabic text-2xl md:text-4xl font-light text-[#3D2B1F] leading-loose"
                        style={{ transform: "translateY(20px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}
                    >
                        العطر ليس مجرد رائحة...
                    </p>

                    <div
                        className="story-fade opacity-0 flex items-center gap-6 my-4"
                        style={{ transform: "translateY(20px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}
                    >
                        <div className="h-px flex-1 bg-gradient-to-r from-[#D4AF37]/50 to-transparent" />
                        <span className="text-[#D4AF37] text-xl">✦</span>
                        <div className="h-px w-16 bg-gradient-to-l from-[#D4AF37]/50 to-transparent" />
                    </div>

                    <p
                        className="story-fade opacity-0 font-arabic text-xl md:text-2xl font-light text-[#5C4033] leading-relaxed"
                        style={{ transform: "translateY(20px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}
                    >
                        بل هو{" "}
                        <span className="text-[#3D2B1F] font-medium">هوية</span>،{" "}
                        <span className="text-[#3D2B1F] font-medium">حضور</span>،
                        <br />
                        وانطباع{" "}
                        <span className="italic text-[#C9A227]">لا يُنسى</span>.
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
                        <p className="font-arabic text-base md:text-lg text-[#8B7355] leading-relaxed font-light max-w-lg">
                            نصنع العطور لمن يبحث عن التميز.
                        </p>
                    </div>
                </div>

                {/* Bottom signature */}
                <div
                    className="story-fade opacity-0 mt-16 pt-10 border-t border-[#D4AF37]/20"
                    style={{ transform: "translateY(20px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}
                >
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="font-arabic text-xs text-[#8B7355]/60 mb-2 tracking-wide">
                                صُنع بشغف منذ
                            </p>
                            <p className="font-serif text-[#D4AF37] text-2xl tracking-widest">
                                MMXXII
                            </p>
                        </div>
                        <div className="text-left">
                            <p className="font-arabic text-xs text-[#8B7355]/60 mb-1">
                                مصنوع في الإمارات
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-px bg-[#D4AF37]/50" />
                                <span className="text-[#D4AF37]/60 text-xs tracking-wider">
                                    UAE
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
