"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

const navLinks = [
    { name: "The Story", href: "#story" },
    { name: "Top Notes", href: "#top-notes" },
    { name: "The Heart", href: "#heart" },
    { name: "The Base", href: "#base" },
    { name: "Shop", href: "#shop" },
];

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        // trigger once on mount
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={clsx(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500 flex items-center justify-between px-6 md:px-12 h-16",
                isScrolled
                    ? "bg-[#0A0806]/80 backdrop-blur-md border-b border-white/[0.03]"
                    : "bg-transparent py-2"
            )}
        >
            <div className="flex-1 flex items-center">
                <span className="font-serif text-xl md:text-2xl tracking-wide font-medium text-white/90 cursor-pointer">
                    Edma Perfume
                </span>
            </div>

            <div className="hidden md:flex flex-1 justify-center space-x-8">
                {navLinks.map((link) => (
                    <a
                        key={link.name}
                        href={link.href}
                        className="text-sm text-[#EBE5D9]/70 hover:text-white transition-colors duration-300 tracking-wider font-light"
                    >
                        {link.name}
                    </a>
                ))}
            </div>

            <div className="flex-1 flex justify-end">
                <button className="relative group overflow-hidden rounded-full p-[1px] transition-transform duration-300 hover:scale-[1.02]">
                    <span className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] via-[#FFBF00] to-[#D4AF37] opacity-60 group-hover:opacity-100 transition-opacity duration-500 rounded-full blur-sm" />
                    <span className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/80 via-white/30 to-[#D4AF37]/80 opacity-40 rounded-full" />
                    <span className="relative block px-6 py-2 bg-[#0A0806] rounded-full text-xs md:text-sm font-medium text-white/90 tracking-wide transition-colors duration-300 group-hover:bg-[#120F0D]">
                        Discover Elinor
                    </span>
                </button>
            </div>
        </nav>
    );
}
