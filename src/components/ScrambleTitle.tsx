"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const EN_WORDS = ["Elinor", "VELOUR", "CECILY"];
const AR_WORDS = ["إلينور", "فيلور", "سيسيلي"];
const EN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const AR_CHARS = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";

export default function ScrambleTitle({
    className = "",
    align = "center"
}: {
    className?: string;
    align?: "left" | "center" | "right";
}) {
    const { language } = useLanguage();
    const [wordIndex, setWordIndex] = useState(0);
    const [displayText, setDisplayText] = useState(language === 'en' ? EN_WORDS[0] : AR_WORDS[0]);
    const [isScrambling, setIsScrambling] = useState(false);

    // Initial sync with language
    useEffect(() => {
        setDisplayText(language === 'en' ? EN_WORDS[wordIndex] : AR_WORDS[wordIndex]);
    }, [language]);

    // Cycle every 3 seconds
    useEffect(() => {
        const cycleInterval = setInterval(() => {
            setWordIndex((prev) => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(cycleInterval);
    }, []);

    // Scramble logic when word changes
    useEffect(() => {
        const targetWord = language === 'en' ? EN_WORDS[wordIndex] : AR_WORDS[wordIndex];
        const chars = language === 'en' ? EN_CHARS : AR_CHARS;

        setIsScrambling(true);
        let iteration = 0;
        const scrambleDuration = 600; // ms
        const frameRate = 40; // ~25fps for a cinematic feel
        const maxIterations = scrambleDuration / frameRate;

        const scrambleInterval = setInterval(() => {
            setDisplayText(() => {
                return targetWord
                    .split("")
                    .map((char, index) => {
                        if (char === " ") return " ";
                        // Lock in characters gradually
                        if (index < (iteration / maxIterations) * targetWord.length) {
                            return char;
                        }
                        // Random noise
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join("");
            });

            if (iteration >= maxIterations) {
                clearInterval(scrambleInterval);
                setDisplayText(targetWord);
                setIsScrambling(false);
            }

            iteration += 1;
        }, frameRate);

        return () => {
            clearInterval(scrambleInterval);
            setIsScrambling(false);
        };
    }, [wordIndex, language]);

    const alignmentClass = align === "center" ? "justify-center text-center" : align === "right" ? "justify-end text-right" : "justify-start text-left";

    return (
        <span
            className={`inline-flex items-center ${alignmentClass} min-w-[180px] md:min-w-[280px] lg:min-w-[320px] ${className}`}
            style={{
                fontVariantNumeric: 'tabular-nums',
                width: 'max-content',
                height: '1.2em'
            }}
        >
            {displayText}
        </span>
    );
}
