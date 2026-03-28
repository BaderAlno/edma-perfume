"use client";

import { motion, Variants } from "framer-motion";

interface RevealTextProps {
    text: string;
    className?: string;
    delay?: number;
    language?: 'en' | 'ar';
}

export default function RevealText({ text, className = "", delay = 0, language = 'en' }: RevealTextProps) {
    // We split by spaces to safely preserve connected Arabic ligatures within words
    const words = text.split(" ");

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: delay,
            },
        },
    };

    const wordVariants: Variants = {
        hidden: {
            y: "120%",
            opacity: 0,
        },
        visible: {
            y: "0%",
            opacity: 1,
            transition: {
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
            },
        },
    };

    return (
        <motion.span
            className={`inline-flex flex-wrap ${className}`}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
            {words.map((word, wordIndex) => (
                <span key={wordIndex} className="overflow-hidden inline-flex">
                    <motion.span
                        variants={wordVariants}
                        className="inline-block"
                        style={{ paddingRight: language === 'ar' ? '0' : '0.25em', paddingLeft: language === 'ar' ? '0.25em' : '0' }}
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </motion.span>
    );
}
