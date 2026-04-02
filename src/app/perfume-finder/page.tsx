"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

// ─── Quiz Questions & Options ────────────────────────────────────────────────
const QUESTIONS = [
    {
        id: "intensity",
        questionEn: "How do you prefer your fragrance?",
        questionAr: "كيف تفضل مستوى قوة عطرك؟",
        options: [
            { id: "light", labelEn: "Light & Airy", labelAr: "خفيف ومنعش", icon: "🍃", keywords: ["fresh", "light", "citrus", "floral", "خفيف", "منعش", "زهري"] },
            { id: "strong", labelEn: "Strong & Bold", labelAr: "قوي وجريء", icon: "🦅", keywords: ["oud", "musk", "strong", "wood", "spicy", "عود", "قوي", "توابل", "مسك"] },
        ],
    },
    {
        id: "time",
        questionEn: "When will you wear it the most?",
        questionAr: "متى سترتدي هذا العطر غالباً؟",
        options: [
            { id: "day", labelEn: "Daytime", labelAr: "النهار", icon: "☀️", keywords: ["day", "fresh", "light", "citrus", "نهار", "يومي", "خفيف"] },
            { id: "night", labelEn: "Nighttime", labelAr: "المساء والمناسبات", icon: "🌙", keywords: ["night", "evening", "dark", "oud", "مساء", "مناسبات", "عود", "عميق"] },
        ],
    },
    {
        id: "vibe",
        questionEn: "What is your favorite scent vibe?",
        questionAr: "ما هو الطابع العطري المفضل لديك؟",
        options: [
            { id: "fresh", labelEn: "Fresh & Citrus", labelAr: "منعش وحمضيات", icon: "🍋", keywords: ["citrus", "fresh", "lemon", "bergamot", "حمضيات", "منعش", "ليمون", "برتقال"] },
            { id: "sweet", labelEn: "Sweet & Floral", labelAr: "زهري وحلو", icon: "🌸", keywords: ["floral", "sweet", "vanilla", "rose", "jasmine", "زهري", "حلو", "فانيلا", "ورد", "ياسمين"] },
            { id: "woody", labelEn: "Woody & Rich", labelAr: "خشبي وعميق", icon: "🪵", keywords: ["wood", "oud", "musk", "sandalwood", "خشبي", "عود", "مسك", "صندل", "غني"] },
        ],
    },
];

type Product = Database["public"]["Tables"]["products"]["Row"];
type Answers = Record<string, string>;

// ─── Animations ─────────────────────────────────────────────────────────────
const variants: Variants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.4, ease: "easeIn" } },
};

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

export default function PerfumeFinderPage() {
    // ─── State ──────────────────────────────────────────────────────────────
    const [step, setStep] = useState<number>(-1); // -1: Intro, 0-2: Questions, 3: Calculating, 4: Results
    const [answers, setAnswers] = useState<Answers>({});
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [recommended, setRecommended] = useState<Product[]>([]);

    const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch all products once when starting
    useEffect(() => {
        async function fetchProducts() {
            try {
                const { data } = await supabase.from("products").select("*").eq("is_active", true);
                setAllProducts(data || []);
            } catch (err) {
                console.error("Error fetching products:", err);
            }
        }
        fetchProducts();
    }, [supabase]);

    const handleAnswer = (questionId: string, optionId: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: optionId }));

        if (step < QUESTIONS.length - 1) {
            setStep((s) => s + 1);
        } else {
            // Finished questions
            calculateResults({ ...answers, [questionId]: optionId });
        }
    };

    const calculateResults = (finalAnswers: Answers) => {
        setStep(QUESTIONS.length); // Loading state

        setTimeout(() => {
            // Aggregate all keywords from selected options
            const selectedKeywords: string[] = [];
            QUESTIONS.forEach((q) => {
                const ans = finalAnswers[q.id];
                const opt = q.options.find((o) => o.id === ans);
                if (opt) selectedKeywords.push(...opt.keywords);
            });

            // Score each product
            const scored = allProducts.map((p) => {
                let score = 0;
                const textToSearch = `${p.name} ${p.name_ar} ${p.description_en || ""} ${p.description_ar || ""}`.toLowerCase();

                selectedKeywords.forEach((kw) => {
                    // Weighted scoring: if exact keyword is present, give points
                    if (textToSearch.includes(kw.toLowerCase())) score += 1;
                });

                return { product: p, score };
            });

            // Sort by score desc, fallback to price if tie (cheapest first just as a tiebreaker)
            scored.sort((a, b) => b.score - a.score || a.product.price_sar - b.product.price_sar);

            // Take top 3
            setRecommended(scored.slice(0, 3).map((s) => s.product));
            setStep(QUESTIONS.length + 1); // Results state
        }, 1500); // Artificial delay for magic effect
    };

    const resetQuiz = () => {
        setAnswers({});
        setStep(-1);
    };

    return (
        <main className="min-h-screen bg-[#0d0905] text-[#EBE5D9] overflow-hidden selection:bg-[#C9A84C]/30 selection:text-[#EBE5D9]" dir="rtl">
            <div className="absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_at_top,_rgba(201,168,76,0.1)_0%,_transparent_70%)] pointer-events-none" />

            <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-32 md:py-48 min-h-[80vh] flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">

                    {/* ─── INTRO ─── */}
                    {step === -1 && (
                        <motion.div
                            key="intro"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="text-center flex flex-col items-center gap-6"
                        >
                            <span className="text-5xl mb-4">✨</span>
                            <span className="text-[#C9A84C] text-sm uppercase tracking-[0.3em] font-sans" dir="ltr">
                                Perfume Finder
                            </span>
                            <h1 className="text-4xl md:text-6xl font-serif text-[#EBE5D9] mb-4">
                                اكتشف عطرك المميز
                            </h1>
                            <p className="text-[#8B7355] text-lg font-sans max-w-lg mx-auto mb-8 leading-relaxed">
                                أجب عن بضعة أسئلة بسيطة، ودعنا نرشح لك العطر الذي يعكس شخصيتك ويكمل أناقتك من تشكيلة إدما الفاخرة.
                            </p>
                            <button
                                onClick={() => setStep(0)}
                                className="group relative inline-flex items-center justify-center px-10 py-4 rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(201,168,76,0.3)] bg-[#120d08] border border-[#C9A84C]/30 hover:border-[#C9A84C]"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-[rgba(201,168,76,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <span className="relative text-[#C9A84C] text-sm md:text-base font-semibold tracking-wide">
                                    ابدأ الآن
                                </span>
                            </button>
                        </motion.div>
                    )}

                    {/* ─── QUESTIONS WIZARD ─── */}
                    {step >= 0 && step < QUESTIONS.length && (
                        <motion.div
                            key={`question-${step}`}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="w-full text-center flex flex-col items-center gap-12"
                        >
                            <div className="flex flex-col gap-2">
                                <span className="text-[#8B7355] text-xs uppercase tracking-widest font-sans" dir="ltr">
                                    Step {step + 1} of {QUESTIONS.length}
                                </span>
                                <div className="flex justify-center gap-2 mt-2">
                                    {QUESTIONS.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 w-12 rounded-full transition-colors duration-500 ${i <= step ? "bg-[#C9A84C]" : "bg-[#C9A84C]/20"}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <h2 className="text-3xl md:text-4xl font-serif text-[#EBE5D9]">
                                    {QUESTIONS[step].questionAr}
                                </h2>
                                <h3 className="text-[#8B7355] text-base md:text-lg font-serif italic font-light" dir="ltr">
                                    "{QUESTIONS[step].questionEn}"
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-3xl mt-4 max-sm:px-4">
                                {QUESTIONS[step].options.map((opt) => (
                                    <motion.button
                                        key={opt.id}
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleAnswer(QUESTIONS[step].id, opt.id)}
                                        className="bg-[#120d08] border border-[#C9A84C]/10 hover:border-[#C9A84C]/50 rounded-2xl p-8 flex flex-col items-center gap-4 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(201,168,76,0.1)] group sm:col-span-1"
                                        style={{ gridColumn: QUESTIONS[step].options.length === 2 ? 'span 1' : 'auto' }}
                                    >
                                        <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
                                            {opt.icon}
                                        </span>
                                        <div className="flex flex-col gap-1 items-center">
                                            <span className="text-[#EBE5D9] font-serif text-lg group-hover:text-[#C9A84C] transition-colors">{opt.labelAr}</span>
                                            <span className="text-[#8B7355] text-[10px] uppercase tracking-widest font-sans" dir="ltr">{opt.labelEn}</span>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Visual balance for 2 items in a 3-col grid */}
                            {QUESTIONS[step].options.length === 2 && (
                                <style jsx>{`
                                    @media (min-width: 640px) {
                                        .grid { display: flex; justify-content: center; }
                                        .grid > button { width: 45%; max-width: 250px; }
                                    }
                                `}</style>
                            )}
                        </motion.div>
                    )}

                    {/* ─── LOADING STATE ─── */}
                    {step === QUESTIONS.length && (
                        <motion.div
                            key="loading"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="text-center flex flex-col items-center gap-8"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                className="w-16 h-16 relative"
                            >
                                <div className="absolute inset-0 border-2 border-[#C9A84C]/20 rounded-full" />
                                <div className="absolute inset-0 border-2 border-[#C9A84C] border-t-transparent rounded-full" />
                            </motion.div>
                            <div className="flex flex-col gap-2">
                                <h2 className="text-2xl font-serif text-[#EBE5D9]">نبحث عن عطرك المثالي...</h2>
                                <span className="text-[#8B7355] font-sans tracking-[0.2em] text-xs uppercase" dir="ltr">Curating your signature</span>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── RESULTS ─── */}
                    {step === QUESTIONS.length + 1 && (
                        <motion.div
                            key="results"
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            className="w-full flex flex-col items-center gap-16"
                        >
                            <div className="text-center flex flex-col items-center gap-4">
                                <span className="text-[#C9A84C] text-sm uppercase tracking-[0.3em] font-sans" dir="ltr">
                                    Your Perfect Matches
                                </span>
                                <h2 className="text-4xl md:text-5xl font-serif text-[#EBE5D9]">
                                    الخيارات الأنسب لك
                                </h2>
                                <div className="w-16 h-px bg-[#C9A84C]/50 mt-2" />
                            </div>

                            <motion.div
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl"
                            >
                                {recommended.length > 0 ? (
                                    recommended.map((product, idx) => (
                                        <motion.div key={product.id} variants={fadeUp} className="relative">
                                            {/* Match Badge for top 1 */}
                                            {idx === 0 && (
                                                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-[#0d0905] text-xs font-bold px-4 py-1.5 rounded-full z-20 shadow-lg transform rotate-[-5deg]">
                                                    التطابق المثالي ✦
                                                </div>
                                            )}

                                            <Link href={`/shop#${product.id}`} className={`group relative flex flex-col h-full bg-[#120d08] border rounded-xl overflow-hidden hover:border-[#C9A84C]/50 transition-colors ${idx === 0 ? "border-[#C9A84C]/40 shadow-[0_0_30px_rgba(201,168,76,0.1)]" : "border-[#C9A84C]/10"}`}>
                                                <div className="relative aspect-[4/5] bg-[#1A1410] overflow-hidden">
                                                    {product.image_url ? (
                                                        <Image
                                                            src={product.image_url}
                                                            alt={product.name_ar || product.name || "Product"}
                                                            fill
                                                            className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-[#8B7355]">
                                                            <div className="w-16 h-24 border border-[#C9A84C]/20 rounded-md mb-2" />
                                                            <span className="text-xs uppercase tracking-widest font-sans">Edma</span>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#120d08] to-transparent opacity-80" />

                                                    {/* Overlaid Title & CTA */}
                                                    <div className="absolute bottom-6 inset-x-0 px-6 flex flex-col items-center text-center gap-2">
                                                        <h3 className="text-[#EBE5D9] text-2xl font-serif">
                                                            {product.name_ar || product.name}
                                                        </h3>
                                                        <span className="text-[#C9A84C] text-lg font-sans tabular-nums mt-1">
                                                            {product.price_sar.toLocaleString('ar-SA')} ر.س
                                                        </span>
                                                        <span className="text-[#EBE5D9] text-xs tracking-wider border border-[#C9A84C]/50 rounded-full px-4 py-1 mt-3 group-hover:bg-[#C9A84C] group-hover:text-[#0d0905] transition-colors duration-300">
                                                            اكتشف العطر
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 text-center text-[#8B7355]">
                                        لم نتمكن من تحديد نتائج مطابقة. يرجى استكشاف مجموعتنا الكاملة.
                                    </div>
                                )}
                            </motion.div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={resetQuiz}
                                    className="px-6 py-2 text-sm text-[#8B7355] border border-[#8B7355]/30 rounded-full hover:text-[#EBE5D9] hover:border-[#EBE5D9]/50 transition-colors"
                                >
                                    إعادة الاختبار (Retake Quiz)
                                </button>
                                <Link
                                    href="/shop"
                                    className="px-6 py-2 text-sm text-[#0d0905] bg-gradient-to-r from-[#D4AF37] to-[#B8960C] rounded-full hover:scale-105 transition-transform font-medium"
                                >
                                    تصفح المجموعة بالكامل
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
