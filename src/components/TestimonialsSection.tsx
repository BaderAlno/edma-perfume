"use client";

import { motion } from "framer-motion";

import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";

export default function TestimonialsSection() {
    const { language } = useLanguage();
    const tTest = translations.testimonials;

    return (
        <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#0A0806] border-y border-[#D4AF37]/10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="max-w-7xl mx-auto flex flex-col items-center">

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className={language === 'ar' ? "font-arabic text-3xl md:text-5xl text-white/90 mb-4 text-glow" : "font-serif text-3xl md:text-5xl text-white/90 mb-4 text-glow tracking-wide"}>
                        {tTest.title[language]}
                    </h2>
                    <p className={language === 'ar' ? "font-arabic text-[#EBE5D9]/70 text-lg md:text-xl font-light" : "font-sans font-light text-[#EBE5D9]/70 text-sm md:text-base tracking-widest uppercase"}>
                        {tTest.subtitle[language]}
                    </p>
                </motion.div>

                {/* Native Scroll Snap Carousel */}
                <div
                    className="flex overflow-x-auto snap-x snap-mandatory gap-6 md:gap-8 w-full pb-12 w-full max-w-full"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        .flex::-webkit-scrollbar { display: none; }
                    `}} />
                    {tTest.items.map((testimonial, idx) => (
                        <motion.div
                            key={testimonial.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.6, delay: idx * 0.15 }}
                            className="snap-center shrink-0 w-[85vw] md:w-[400px] bg-white/5 backdrop-blur-sm border border-[#D4AF37]/20 rounded-2xl p-8 flex flex-col gap-6 relative group hover:bg-white/10 hover:border-[#D4AF37]/40 transition-all duration-500"
                        >
                            {/* Decorative Quote Icon */}
                            <div className={language === 'ar' ? "absolute top-6 right-6 text-[#D4AF37]/20 font-serif text-6xl leading-none group-hover:text-[#D4AF37]/40 transition-colors" : "absolute top-6 left-6 text-[#D4AF37]/20 font-serif text-6xl leading-none rotate-180 group-hover:text-[#D4AF37]/40 transition-colors"}>
                                "
                            </div>

                            <p className={language === 'ar' ? "font-arabic font-light text-[#EBE5D9]/90 text-lg leading-relaxed relative z-10" : "font-serif font-light text-[#EBE5D9]/90 text-lg leading-relaxed relative z-10 italic tracking-wide"}>
                                "{testimonial.quote[language]}"
                            </p>

                            <div className="mt-auto pt-6 border-t border-[#D4AF37]/10 flex flex-col">
                                <span className={language === 'ar' ? "font-arabic text-[#D4AF37] text-lg mb-1" : "font-serif tracking-widest text-[#D4AF37] text-sm md:text-base mb-1"}>
                                    {testimonial.author[language]}
                                </span>
                                <span className={language === 'ar' ? "font-arabic font-light text-[#EBE5D9]/50 text-xs" : "font-sans font-light text-[#EBE5D9]/50 text-[10px] tracking-widest uppercase"}>
                                    {testimonial.role[language]}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}
