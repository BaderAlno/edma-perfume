"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// Detects whether an element (or its ancestor) is interactive
function isInteractive(el: HTMLElement | null): boolean {
    if (!el || el === document.body) return false;
    const tag = el.tagName.toLowerCase();
    if (tag === "a" || tag === "button" || tag === "input" || tag === "select" || tag === "textarea") return true;
    if (el.getAttribute("role") === "button") return true;
    if (el.classList.contains("interactive")) return true;
    if (el.hasAttribute("data-cursor-text")) return true;
    return isInteractive(el.parentElement);
}

function getCursorText(el: HTMLElement | null): string {
    if (!el || el === document.body) return "";
    if (el.hasAttribute("data-cursor-text")) return el.getAttribute("data-cursor-text") ?? "";
    return getCursorText(el.parentElement);
}

export default function CustomCursor() {
    const [visible,     setVisible]     = useState(false);
    const [hovered,     setHovered]     = useState(false);
    const [clicked,     setClicked]     = useState(false);
    const [cursorText,  setCursorText]  = useState("");
    const [showCursor,  setShowCursor]  = useState(false);
    const hasFine = useRef(false);

    // Raw mouse position (no lag — for the inner precision dot)
    const rawX = useMotionValue(-100);
    const rawY = useMotionValue(-100);

    // Spring-smoothed position for the outer ring (trails slightly for elegance)
    const springCfg = { stiffness: 240, damping: 22, mass: 0.4 };
    const ringX = useSpring(rawX, springCfg);
    const ringY = useSpring(rawY, springCfg);

    useEffect(() => {
        hasFine.current = window.matchMedia("(pointer: fine)").matches;
        if (!hasFine.current) return;
        setShowCursor(true);

        function onMove(e: MouseEvent) {
            rawX.set(e.clientX);
            rawY.set(e.clientY);
            if (!visible) setVisible(true);
        }

        function onOver(e: MouseEvent) {
            const el = e.target as HTMLElement;
            setCursorText(getCursorText(el));
            setHovered(isInteractive(el));
        }

        function onDown() { setClicked(true); }
        function onUp()   { setClicked(false); }
        function onLeave() { setVisible(false); setHovered(false); setCursorText(""); }

        window.addEventListener("mousemove",  onMove,  { passive: true });
        window.addEventListener("mouseover",  onOver,  { passive: true });
        window.addEventListener("mousedown",  onDown,  { passive: true });
        window.addEventListener("mouseup",    onUp,    { passive: true });
        document.documentElement.addEventListener("mouseleave", onLeave);

        return () => {
            window.removeEventListener("mousemove",  onMove);
            window.removeEventListener("mouseover",  onOver);
            window.removeEventListener("mousedown",  onDown);
            window.removeEventListener("mouseup",    onUp);
            document.documentElement.removeEventListener("mouseleave", onLeave);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // SSR-safe: showCursor is false until useEffect confirms pointer: fine
    if (!showCursor) return null;

    const hasText  = cursorText.length > 0;
    const ringSize = hasText ? 72 : hovered ? 44 : 20;

    return (
        <>
            {/* ── Outer gold ring ────────────────────────────────────────── */}
            <motion.div
                aria-hidden="true"
                className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full flex items-center justify-center overflow-hidden select-none"
                style={{
                    x:          ringX,
                    y:          ringY,
                    translateX: "-50%",
                    translateY: "-50%",
                    opacity:    visible ? 1 : 0,
                }}
                animate={{
                    width:  ringSize,
                    height: ringSize,
                    backgroundColor: hasText
                        ? "rgba(201,168,76,0.93)"
                        : hovered
                            ? "rgba(201,168,76,0.06)"
                            : "rgba(201,168,76,0)",
                    border: (hovered || hasText)
                        ? "1.5px solid rgba(201,168,76,0.85)"
                        : "1.5px solid rgba(201,168,76,0.6)",
                    boxShadow: hovered
                        ? "0 0 20px rgba(201,168,76,0.18), inset 0 0 12px rgba(201,168,76,0.06)"
                        : "none",
                    color: hasText ? "#0D0A07" : "transparent",
                    scale: clicked ? 0.80 : 1,
                }}
                transition={{
                    width:           { type: "spring", stiffness: 260, damping: 22 },
                    height:          { type: "spring", stiffness: 260, damping: 22 },
                    backgroundColor: { duration: 0.18 },
                    border:          { duration: 0.18 },
                    boxShadow:       { duration: 0.22 },
                    scale:           { type: "spring", stiffness: 420, damping: 26 },
                    opacity:         { duration: 0.15 },
                }}
            >
                {hasText && (
                    <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.16 }}
                        className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] select-none"
                        style={{ fontFamily: "var(--font-inter), sans-serif" }}
                    >
                        {cursorText}
                    </motion.span>
                )}
            </motion.div>

            {/* ── Inner precision dot ────────────────────────────────────── */}
            {/* Tracks exactly with the pointer — no spring lag */}
            <motion.div
                aria-hidden="true"
                className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full"
                style={{
                    x:          rawX,
                    y:          rawY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                animate={{
                    width:           hasText ? 0  : 4,
                    height:          hasText ? 0  : 4,
                    opacity:         visible && !hasText ? 1 : 0,
                    backgroundColor: hovered
                        ? "rgba(201,168,76,1)"
                        : "rgba(201,168,76,0.75)",
                    scale: clicked ? 0.4 : 1,
                }}
                transition={{
                    opacity: { duration: 0.12 },
                    scale:   { type: "spring", stiffness: 500, damping: 30 },
                }}
            />
        </>
    );
}
