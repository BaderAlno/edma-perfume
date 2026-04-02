"use client";

import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

// ── Types ─────────────────────────────────────────────────────────────────────

type Lang = "en" | "ar";

interface QuoteItem {
    text: { en: string; ar: string };
    bg: string;
    textColor: string;
}

interface ProductItem {
    label: string;
    image: string;
    alt: { en: string; ar: string };
    bg: string;
}

// ── Column data ───────────────────────────────────────────────────────────────

const leftQuotes: QuoteItem[] = [
    {
        text: { en: "Be the scent that is never forgotten. — Niccolò Machiavelli", ar: "كن الرائحة التي لا تُنسى. — نيكولو مكيافيلي" },
        bg: "#C9A227",
        textColor: "#3D2B1F",
    },
    {
        text: { en: "Discover the magic of timeless luxury", ar: "اكتشف سحر الفخامة الخالدة" },
        bg: "#3D2B1F",
        textColor: "#D4AF37",
    },
    {
        text: { en: "Fragrance is a philosophy of presence… not explained, but felt. — Martin Heidegger", ar: "العطر فلسفة حضور… لا تُفسَّر بل تُحس. — مارتن هايدغر" },
        bg: "#3D2B1F",
        textColor: "#D4AF37",
    },
];

const centerProducts: ProductItem[] = [
    {
        label: "ELINOR",
        image: "/new_elinor.png",
        alt: { en: "Elinor Perfume", ar: "عطر إلينور" },
        bg: "#F5EFE4",
    },
    {
        label: "CECILY",
        image: "/new_CECLIY.jpg",
        alt: { en: "Cecily Perfume", ar: "عطر سيسيلي" },
        bg: "#F0E8D8",
    },
    {
        label: "VELOUR",
        image: "/new_VELOUR.jpg",
        alt: { en: "Velour Perfume", ar: "عطر فيلور" },
        bg: "#1A0E08",
    },
];

const rightQuotes: QuoteItem[] = [
    {
        text: { en: "Embrace the essence of elegance and refinement", ar: "تمتع بجوهر الأناقة والرقي" },
        bg: "#C9A227",
        textColor: "#3D2B1F",
    },
    {
        text: { en: "Luxury is not in what you own… but in the impression you leave behind. — Socrates", ar: "ليست الفخامة فيما تملك… بل فيما تتركه من أثر. — سقراط" },
        bg: "#3D2B1F",
        textColor: "#D4AF37",
    },
    {
        text: { en: "Your fragrance signature… an indelible mark on memory.", ar: "بصمتك العطرية.. توقيع لا يُمحى من الذاكرة." },
        bg: "#3D2B1F",
        textColor: "#D4AF37",
    },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function QuoteTile({ text, bg, textColor, lang }: QuoteItem & { lang: Lang }) {
    return (
        <div
            className="absolute inset-0 flex items-center justify-center p-5 transition-transform duration-500 group-hover:scale-[1.02]"
            style={{ backgroundColor: bg }}
        >
            {/* Inner border */}
            <div className="absolute inset-2 border border-white/15 pointer-events-none" />
            {/* Gradient sheen */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            <div className="relative z-10 text-center">
                <span
                    className={
                        lang === "ar"
                            ? "font-arabic text-sm md:text-base font-light leading-relaxed block"
                            : "font-sans uppercase text-[9px] md:text-[11px] tracking-widest font-light leading-relaxed px-2 block"
                    }
                    style={{ color: textColor }}
                >
                    {text[lang]}
                </span>
                <div
                    className="mt-3 w-8 h-px mx-auto"
                    style={{
                        background: `linear-gradient(to right, transparent, ${textColor}, transparent)`,
                        opacity: 0.5,
                    }}
                />
            </div>

            {/* Corner ornaments */}
            <div className="absolute top-3 left-3 w-3 h-3 border-t border-l opacity-30" style={{ borderColor: textColor }} />
            <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r opacity-30" style={{ borderColor: textColor }} />
        </div>
    );
}

function ProductTile({ image, alt, label, bg, lang }: ProductItem & { lang: Lang }) {
    return (
        <div className="absolute inset-0" style={{ backgroundColor: bg }}>
            <Image
                src={image}
                alt={alt[lang]}
                fill
                className="object-contain transition-transform duration-700 group-hover:scale-105 p-4"
                sizes="(max-width: 768px) 100vw, 33vw"
            />
            {/* Label on hover */}
            <div className="absolute bottom-0 inset-x-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                <span className="font-serif text-xs tracking-[0.3em] text-[#3D2B1F]/70">{label}</span>
            </div>
            {/* Subtle hover vignette at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
    );
}

// ── Shared tile wrapper ───────────────────────────────────────────────────────

function Tile({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative w-full aspect-[3/4] overflow-hidden group border border-[#D4AF37]/10 rounded-sm cursor-pointer">
            {children}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InstagramGrid() {
    const { language } = useLanguage();
    const lang = language as Lang;

    const tHeaders = {
        gallery: { en: "Gallery of Elegance", ar: "معرض الأناقة" },
        world:   { en: "World of Edma",        ar: "عالم إدما"    },
        footer:  {
            en: "EDMA… where fragrance whispers what words cannot",
            ar: "إدما.. حيث يهمس العطر بما تعجز عنه الكلمات",
        },
    };

    return (
        <section
            id="instagram-grid"
            dir={lang === "ar" ? "rtl" : "ltr"}
            className="py-20 px-4 md:px-8 bg-[#F5EFE4]"
        >
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-14 text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-[#D4AF37] to-transparent" />
                    <span
                        className={
                            lang === "ar"
                                ? "text-[#D4AF37] text-xs tracking-[0.35em] font-light uppercase font-arabic"
                                : "text-[#D4AF37] text-[10px] md:text-xs tracking-[0.45em] font-light uppercase font-sans"
                        }
                    >
                        {tHeaders.gallery[lang]}
                    </span>
                    <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-[#D4AF37] to-transparent" />
                </div>
                <h2
                    className={
                        lang === "ar"
                            ? "font-arabic text-3xl md:text-4xl font-light text-[#3D2B1F] leading-relaxed"
                            : "font-serif text-3xl md:text-4xl font-light text-[#3D2B1F] leading-relaxed tracking-wide"
                    }
                >
                    {tHeaders.world[lang]}
                </h2>
            </div>

            {/* ── 3-Column Grid ─────────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-2 md:gap-3 items-start">

                {/* ── Left column — quotes ─────────────────────────────────── */}
                <div className="w-full md:w-1/3 flex flex-col gap-2 md:gap-3 order-2 md:order-1">
                    {leftQuotes.map((item, i) => (
                        <Tile key={`left-${i}`}>
                            <QuoteTile
                                text={item.text}
                                bg={item.bg}
                                textColor={item.textColor}
                                lang={lang}
                            />
                        </Tile>
                    ))}
                </div>

                {/* ── Center column — perfumes ─────────────────────────────── */}
                <div className="w-full md:w-1/3 flex flex-col gap-2 md:gap-3 order-1 md:order-2">
                    {centerProducts.map((item, i) => (
                        <Tile key={`center-${i}`}>
                            <ProductTile
                                image={item.image}
                                alt={item.alt}
                                label={item.label}
                                bg={item.bg}
                                lang={lang}
                            />
                        </Tile>
                    ))}
                </div>

                {/* ── Right column — quotes ────────────────────────────────── */}
                <div className="w-full md:w-1/3 flex flex-col gap-2 md:gap-3 order-3 md:order-3">
                    {rightQuotes.map((item, i) => (
                        <Tile key={`right-${i}`}>
                            <QuoteTile
                                text={item.text}
                                bg={item.bg}
                                textColor={item.textColor}
                                lang={lang}
                            />
                        </Tile>
                    ))}
                </div>

            </div>

            {/* Footer line */}
            <div className="max-w-5xl mx-auto mt-10 text-center">
                <span
                    className={
                        lang === "ar"
                            ? "font-arabic text-sm text-[#8B7355] leading-loose block"
                            : "font-sans uppercase text-[10px] tracking-[0.2em] text-[#8B7355] leading-loose block"
                    }
                >
                    {tHeaders.footer[lang]}
                </span>
            </div>
        </section>
    );
}
