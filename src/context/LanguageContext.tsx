"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "ar";

interface LanguageContextProps {
    language: Language;
    toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("ar"); // Default to Arabic
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const savedLang = localStorage.getItem("edma-lang") as Language;
        if (savedLang === "en" || savedLang === "ar") {
            setLanguage(savedLang);
        }
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        // Persist user preference
        localStorage.setItem("edma-lang", language);

        // Update DOM direction and language attributes
        document.documentElement.lang = language;
        document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

        // Update body class for typography overrides
        if (language === "ar") {
            document.body.classList.remove("lang-en");
            document.body.classList.add("lang-ar");
        } else {
            document.body.classList.remove("lang-ar");
            document.body.classList.add("lang-en");
        }
    }, [language, isMounted]);

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === "ar" ? "en" : "ar"));
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
