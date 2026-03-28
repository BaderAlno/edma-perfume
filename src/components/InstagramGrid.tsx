"use client";

import Image from "next/image";

import { useLanguage } from "@/context/LanguageContext";

const gridItems = [
    {
        type: "product",
        image: "/new_elinor.png",
        alt: { en: "Elinor Perfume", ar: "عطر إلينور" },
        bgColor: "#F5EFE4",
    },
    {
        type: "text",
        text: { en: "Embrace the essence of elegance and refinement", ar: "تمتع بجوهر الأناقة والرقي" },
        bgColor: "#C9A227",
        textColor: "#3D2B1F",
    },
    {
        type: "lifestyle",
        image: "/lifestyle_wrist.png",
        alt: { en: "Sophisticated lifestyle", ar: "أسلوب حياة راقٍ" },
        bgColor: "#2A1810",
    },
    {
        type: "lifestyle",
        image: "/lifestyle_desert.png",
        alt: { en: "Perfume in the desert", ar: "عطر في الصحراء" },
        bgColor: "#3D2B1F",
    },
    {
        type: "text",
        text: { en: "Discover the magic of timeless luxury", ar: "اكتشف سحر الفخامة الخالدة" },
        bgColor: "#3D2B1F",
        textColor: "#D4AF37",
    },
    {
        type: "product",
        image: "/product_trio.png",
        alt: { en: "Perfume collection", ar: "مجموعة العطور" },
        bgColor: "#EDE3D0",
    },
    {
        type: "text",
        text: { en: "Choose your perfume, express your story", ar: "اختر عطرك، عبّر عن حكايتك" },
        bgColor: "#E5C84A",
        textColor: "#3D2B1F",
    },
    {
        type: "lifestyle",
        image: "/new_VELOUR.jpg",
        alt: { en: "Night perfume", ar: "عطر ليلي" },
        bgColor: "#1A0E08",
    },
    {
        type: "product",
        image: "/new_CECLIY.jpg",
        alt: { en: "Day perfume", ar: "عطر نهاري" },
        bgColor: "#F0E8D8",
    },
];

export default function InstagramGrid() {
    const { language } = useLanguage();

    const tHeaders = {
        gallery: { en: "Gallery of Elegance", ar: "معرض الأناقة" },
        world: { en: "World of Edma", ar: "عالم إدما" },
        footerRow: { en: "Every drop tells a story · Every perfume leaves a mark", ar: "كل قطرة تحكي قصة · كل عطر يترك أثراً" }
    };

    return (
        <section
            id="instagram-grid"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            className="py-20 px-4 md:px-8 bg-[#F5EFE4]"
        >
            {/* Section Header */}
            <div className="max-w-7xl mx-auto mb-14 text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-[#D4AF37] to-transparent" />
                    <span className={language === 'ar' ? "text-[#D4AF37] text-xs tracking-[0.35em] font-light uppercase font-arabic" : "text-[#D4AF37] text-[10px] md:text-xs tracking-[0.45em] font-light uppercase font-sans"}>
                        {tHeaders.gallery[language]}
                    </span>
                    <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-[#D4AF37] to-transparent" />
                </div>
                <h2 className={language === 'ar' ? "font-arabic text-3xl md:text-4xl font-light text-[#3D2B1F] leading-relaxed" : "font-serif text-3xl md:text-4xl font-light text-[#3D2B1F] leading-relaxed tracking-wide"}>
                    {tHeaders.world[language]}
                </h2>
            </div>

            {/* Grid */}
            <div className="max-w-4xl mx-auto grid grid-cols-3 gap-2 md:gap-3">
                {gridItems.map((item, index) => (
                    <div
                        key={index}
                        className="relative w-full h-[45vh] md:h-[60vh] overflow-hidden group border border-[#D4AF37]/10 bg-[#2A1810]/40 rounded-sm cursor-pointer"
                        id={`grid-item-${index}`}
                    >
                        {item.type === "text" ? (
                            // Text tile
                            <div
                                className="absolute inset-0 flex items-center justify-center p-4 transition-all duration-500 group-hover:scale-[1.02]"
                                style={{ backgroundColor: item.bgColor }}
                            >
                                {/* Decorative border */}
                                <div className="absolute inset-2 border border-white/20" />
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

                                {/* Arabic ornament */}
                                <div className="text-center relative z-10">
                                    <div
                                        className={language === 'ar' ? "font-arabic text-sm md:text-base font-light leading-relaxed" : "font-sans uppercase text-[9px] md:text-[10px] tracking-widest font-light leading-relaxed px-4"}
                                        style={{ color: item.textColor }}
                                    >
                                        {(item.text as { en: string, ar: string })[language]}
                                    </div>
                                    <div
                                        className="mt-3 w-8 h-px mx-auto"
                                        style={{
                                            background: `linear-gradient(to right, transparent, ${item.textColor}, transparent)`,
                                            opacity: 0.6,
                                        }}
                                    />
                                </div>

                                {/* Corner ornaments */}
                                <div
                                    className={language === 'ar' ? "absolute top-3 right-3 w-3 h-3 border-t border-r opacity-40" : "absolute top-3 left-3 w-3 h-3 border-t border-l opacity-40"}
                                    style={{ borderColor: item.textColor }}
                                />
                                <div
                                    className={language === 'ar' ? "absolute bottom-3 left-3 w-3 h-3 border-b border-l opacity-40" : "absolute bottom-3 right-3 w-3 h-3 border-b border-r opacity-40"}
                                    style={{ borderColor: item.textColor }}
                                />
                            </div>
                        ) : (
                            // Image tile
                            <div
                                className="absolute inset-0"
                                style={{ backgroundColor: item.bgColor }}
                            >
                                <Image
                                    src={item.image!}
                                    alt={(item.alt as { en: string, ar: string })[language]}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#3D2B1F]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                {/* EDMA logo on hover */}
                                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <span className="text-white/80 text-xs font-light tracking-widest font-arabic">
                                        EDMA
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Bottom text */}
            <div className="max-w-4xl mx-auto mt-10 text-center">
                <p className={language === 'ar' ? "font-arabic text-sm text-[#8B7355] leading-loose" : "font-sans uppercase text-[10px] tracking-[0.2em] text-[#8B7355] leading-loose"}>
                    {tHeaders.footerRow[language]}
                </p>
            </div>
        </section>
    );
}
