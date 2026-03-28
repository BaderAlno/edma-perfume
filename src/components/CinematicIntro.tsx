"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LETTERS = ["E", "D", "M", "A"] as const;
const SESSION_KEY = "edma-intro-seen";

export default function CinematicIntro() {
    const [visible,    setVisible]    = useState(false);
    const [dissolving, setDissolving] = useState(false);

    useEffect(() => {
        if (!sessionStorage.getItem(SESSION_KEY)) {
            setVisible(true);
        }
    }, []);

    function handleEnter() {
        setDissolving(true);
        // Wait for letter exit animations, then unmount the overlay
        setTimeout(() => setVisible(false), 550);
    }

    return (
        <AnimatePresence onExitComplete={() => sessionStorage.setItem(SESSION_KEY, "1")}>
            {visible && (
                <motion.div
                    key="cinematic-intro"
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
                    className="fixed inset-0 z-[300] bg-[#0A0806] flex flex-col items-center justify-center overflow-hidden select-none"
                    style={{ pointerEvents: dissolving ? "none" : "auto" }}
                >
                    {/* Ambient radial glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,_rgba(201,168,76,0.07)_0%,_transparent_65%)] pointer-events-none" />

                    {/* Thin top/bottom border lines */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={dissolving ? { scaleX: 0 } : { scaleX: 1 }}
                        transition={dissolving ? { duration: 0.3 } : { delay: 0.1, duration: 1.0, ease: "easeOut" }}
                        className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent"
                    />
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={dissolving ? { scaleX: 0 } : { scaleX: 1 }}
                        transition={dissolving ? { duration: 0.3 } : { delay: 0.1, duration: 1.0, ease: "easeOut" }}
                        className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent"
                    />

                    {/* EDMA letters */}
                    <div className="flex gap-2 sm:gap-6 md:gap-10 mb-6">
                        {LETTERS.map((letter, i) => (
                            <motion.span
                                key={letter}
                                initial={{ opacity: 0, y: 36, filter: "blur(10px)" }}
                                animate={dissolving
                                    ? { opacity: 0, y: -24, filter: "blur(14px)" }
                                    : { opacity: 1, y: 0, filter: "blur(0px)" }
                                }
                                transition={dissolving
                                    ? { delay: i * 0.05, duration: 0.45, ease: [0.55, 0, 1, 0.45] }
                                    : { delay: 0.15 + i * 0.16, duration: 0.95, ease: [0.22, 1, 0.36, 1] }
                                }
                                className="font-serif leading-none text-[#EBE5D9] font-light"
                                style={{
                                    fontSize: "clamp(72px, 18vw, 180px)",
                                    textShadow: "0 0 100px rgba(201,168,76,0.12)",
                                    letterSpacing: "0.06em",
                                }}
                            >
                                {letter}
                            </motion.span>
                        ))}
                    </div>

                    {/* Tagline */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={dissolving ? { opacity: 0 } : { opacity: 1 }}
                        transition={dissolving
                            ? { duration: 0.25 }
                            : { delay: 0.9, duration: 0.9 }
                        }
                        className="font-serif text-sm text-[#C9A84C]/45 italic tracking-[0.35em] mb-9"
                    >
                        Invisible elegance. Unforgettable presence.
                    </motion.p>

                    {/* Gold divider */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={dissolving ? { scaleX: 0 } : { scaleX: 1 }}
                        transition={dissolving
                            ? { duration: 0.25 }
                            : { delay: 1.2, duration: 0.55, ease: "easeOut" }
                        }
                        className="w-14 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/55 to-transparent mb-9"
                    />

                    {/* Enter button */}
                    <motion.button
                        initial={{ opacity: 0, y: 14 }}
                        animate={dissolving ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
                        transition={dissolving
                            ? { duration: 0.25 }
                            : { delay: 1.5, duration: 0.7, ease: "easeOut" }
                        }
                        onClick={handleEnter}
                        className="relative overflow-hidden font-sans text-[11px] uppercase tracking-[0.45em] text-[#C9A84C] border border-[#C9A84C]/30 px-14 py-4 rounded-full hover:bg-[#C9A84C]/8 hover:border-[#C9A84C]/55 transition-all duration-500 group"
                    >
                        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/35 to-transparent" />
                        <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/15 to-transparent" />
                        Enter
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
