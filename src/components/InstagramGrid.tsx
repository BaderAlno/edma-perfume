"use client";

import Image from "next/image";

const gridItems = [
    {
        type: "product",
        image: "/hero_bottle.png",
        alt: "عطر إلينور",
        bgColor: "#F5EFE4",
    },
    {
        type: "text",
        text: "تمتع بجوهر الأناقة والرقي",
        bgColor: "#C9A227",
        textColor: "#3D2B1F",
    },
    {
        type: "lifestyle",
        image: "/lifestyle_wrist.png",
        alt: "أسلوب حياة راقٍ",
        bgColor: "#2A1810",
    },
    {
        type: "lifestyle",
        image: "/lifestyle_desert.png",
        alt: "عطر في الصحراء",
        bgColor: "#3D2B1F",
    },
    {
        type: "text",
        text: "اكتشف سحر الفخامة الخالدة",
        bgColor: "#3D2B1F",
        textColor: "#D4AF37",
    },
    {
        type: "product",
        image: "/product_trio.png",
        alt: "مجموعة العطور",
        bgColor: "#EDE3D0",
    },
    {
        type: "text",
        text: "اختر عطرك، عبّر عن حكايتك",
        bgColor: "#E5C84A",
        textColor: "#3D2B1F",
    },
    {
        type: "lifestyle",
        image: "/product_bottle1.png",
        alt: "عطر ليلي",
        bgColor: "#1A0E08",
    },
    {
        type: "product",
        image: "/product_bottle2.png",
        alt: "عطر نهاري",
        bgColor: "#F0E8D8",
    },
];

const arabicDecorations = [
    "تمتع بجوهر الأناقة والرقي",
    "اكتشف سحر الفخامة الخالدة",
    "اختر عطرك، عبّر عن حكايتك",
];

export default function InstagramGrid() {
    return (
        <section
            id="instagram-grid"
            dir="rtl"
            className="py-20 px-4 md:px-8 bg-[#F5EFE4]"
        >
            {/* Section Header */}
            <div className="max-w-7xl mx-auto mb-14 text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-[#D4AF37] to-transparent" />
                    <span className="text-[#D4AF37] text-xs tracking-[0.35em] font-light uppercase font-arabic">
                        معرض الأناقة
                    </span>
                    <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-[#D4AF37] to-transparent" />
                </div>
                <h2 className="font-arabic text-3xl md:text-4xl font-light text-[#3D2B1F] leading-relaxed">
                    عالم إدما
                </h2>
            </div>

            {/* Grid */}
            <div className="max-w-4xl mx-auto grid grid-cols-3 gap-2 md:gap-3">
                {gridItems.map((item, index) => (
                    <div
                        key={index}
                        className="relative aspect-square overflow-hidden group cursor-pointer"
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
                                        className="font-arabic text-sm md:text-base font-light leading-relaxed"
                                        style={{ color: item.textColor }}
                                    >
                                        {item.text}
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
                                    className="absolute top-3 right-3 w-3 h-3 border-t border-r opacity-40"
                                    style={{ borderColor: item.textColor }}
                                />
                                <div
                                    className="absolute bottom-3 left-3 w-3 h-3 border-b border-l opacity-40"
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
                                    alt={item.alt!}
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
                <p className="font-arabic text-sm text-[#8B7355] leading-loose">
                    كل قطرة تحكي قصة · كل عطر يترك أثراً
                </p>
            </div>
        </section>
    );
}
