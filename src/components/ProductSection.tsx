"use client";

import Image from "next/image";

const products = [
    {
        id: "elinor",
        nameAr: "إلينور",
        nameEn: "Elinor",
        descAr: "رونق يلمسك، وأناقة تبقى",
        storyAr:
            "عطر يجمع بين النضارة الشرقية والجاذبية الحديثة. إلينور ليست مجرد عطر — بل هي من أنتِ.",
        notes: ["ورد طائفي", "عود كمبودي", "مسك أبيض", "لبان ذكر"],
        image: "/hero_bottle.png",
        bgFrom: "#F5EFE4",
        accent: "#C9A227",
    },
    {
        id: "khumra",
        nameAr: "خُمرة",
        nameEn: "Khumra",
        descAr: "عمق يسكن الروح",
        storyAr:
            "من قلب الصحراء العربية، تنبثق خُمرة بسطوة العود الخام وسحر الأنبر. حضور يُشعل المخيّلة.",
        notes: ["عود هندي", "أنبر", "صندل", "زعفران"],
        image: "/product_bottle1.png",
        bgFrom: "#1A0E08",
        accent: "#D4AF37",
    },
    {
        id: "layla",
        nameAr: "ليلى",
        nameEn: "Layla",
        descAr: "هدوء يملأ المكان",
        storyAr:
            "ليلى — العطر الذي ينسجم مع الهمسات. ناعم كالحرير، عميق كالليل. للمرأة التي تختار الجمال الهادئ.",
        notes: ["ياسمين", "ورد بلغاري", "مسك أبيض", "خشب الأرز"],
        image: "/product_bottle2.png",
        bgFrom: "#F0E8D8",
        accent: "#B8860B",
    },
];

export default function ProductSection() {
    return (
        <section
            id="products"
            dir="rtl"
            className="py-24 px-4 md:px-8 bg-[#1A0E08] relative overflow-hidden"
        >
            {/* Background texture */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1A0E08] via-[#2A1810] to-[#1A0E08]" />
            <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(45deg, #D4AF37 0px, #D4AF37 1px, transparent 1px, transparent 20px)",
                    }}
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-[#D4AF37] to-transparent" />
                        <span className="text-[#D4AF37] text-xs tracking-[0.35em] uppercase font-light">
                            مجموعتنا
                        </span>
                        <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-[#D4AF37] to-transparent" />
                    </div>
                    <h2 className="font-arabic text-3xl md:text-5xl font-light text-[#EBE5D9] leading-snug">
                        عطورنا الفاخرة
                    </h2>
                    <p className="font-arabic text-[#D4AF37]/70 text-sm mt-3 font-light">
                        كل عطر، قصة لا تُنسى
                    </p>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            id={`product-${product.id}`}
                            className="group relative bg-gradient-to-b from-[#2A1810] to-[#1A0E08] border border-[#D4AF37]/15 overflow-hidden transition-all duration-500 hover:border-[#D4AF37]/40 hover:shadow-[0_0_40px_rgba(212,175,55,0.1)]"
                        >
                            {/* Product Image */}
                            <div
                                className="relative h-72 overflow-hidden flex items-center justify-center"
                                style={{ background: product.bgFrom }}
                            >
                                <Image
                                    src={product.image}
                                    alt={product.nameAr}
                                    fill
                                    className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
                                />
                                {/* Glow */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700"
                                    style={{
                                        background: `radial-gradient(circle at 50% 80%, ${product.accent}, transparent 60%)`,
                                    }}
                                />
                            </div>

                            {/* Product Info */}
                            <div className="p-6">
                                {/* Name */}
                                <div className="mb-4">
                                    <h3
                                        className="font-arabic text-2xl font-light mb-1"
                                        style={{ color: product.accent }}
                                    >
                                        {product.nameAr}
                                    </h3>
                                    <p className="text-[#EBE5D9]/40 text-xs tracking-widest uppercase font-light">
                                        {product.nameEn}
                                    </p>
                                </div>

                                {/* Thin divider */}
                                <div
                                    className="w-12 h-px mb-4"
                                    style={{
                                        background: `linear-gradient(to left, transparent, ${product.accent})`,
                                    }}
                                />

                                {/* Tagline */}
                                <p
                                    className="font-arabic text-sm font-medium mb-3"
                                    style={{ color: product.accent }}
                                >
                                    {product.descAr}
                                </p>

                                {/* Story */}
                                <p className="font-arabic text-[#EBE5D9]/70 text-sm leading-relaxed mb-5 font-light">
                                    {product.storyAr}
                                </p>

                                {/* Notes */}
                                <div className="mb-6">
                                    <p className="text-[#D4AF37]/50 text-xs mb-2 tracking-wider font-arabic">
                                        النوتات
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {product.notes.map((note) => (
                                            <span
                                                key={note}
                                                className="font-arabic text-xs border px-3 py-1 rounded-full transition-colors duration-300"
                                                style={{
                                                    borderColor: `${product.accent}40`,
                                                    color: `${product.accent}CC`,
                                                    background: `${product.accent}10`,
                                                }}
                                            >
                                                {note}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Button */}
                                <button
                                    id={`order-btn-${product.id}`}
                                    className="w-full py-3 font-arabic text-sm font-semibold tracking-wide transition-all duration-300 hover:shadow-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${product.accent}, ${product.accent}CC)`,
                                        color: "#1A0E08",
                                    }}
                                >
                                    اطلب الآن
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
