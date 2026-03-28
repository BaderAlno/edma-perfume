"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait">
            <motion.div key={pathname} className="relative h-full w-full">

                {/* The global sweeper overlay: sweeps left to right over 0.6s */}
                <motion.div
                    className="fixed inset-0 z-[99999] bg-[#0A0806] pointer-events-none"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    exit={{ x: "100%" }} // Stays offscreen on old component exit
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                />

                {/* The Page Content - Fades up with delay to wait for sweeper */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                    className="h-full w-full"
                >
                    {children}
                </motion.div>

            </motion.div>
        </AnimatePresence>
    );
}
