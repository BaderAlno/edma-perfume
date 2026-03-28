"use client";

import { useEffect, useRef } from "react";
import { useScroll, useTransform, useMotionValueEvent } from "framer-motion";

const TOTAL_FRAMES = 240;

function drawImageCentered(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    canvas: HTMLCanvasElement
) {
    const canvasRatio = canvas.width / canvas.height;
    const iW = img.naturalWidth || img.width;
    const iH = img.naturalHeight || img.height;
    if (!iW || !iH) return;

    const imgRatio = iW / iH;
    let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number;

    if (canvasRatio > imgRatio) {
        drawHeight = canvas.height;
        drawWidth = iW * (canvas.height / iH);
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
    } else {
        drawWidth = canvas.width;
        drawHeight = iH * (canvas.width / iW);
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
    }

    // Fill background
    ctx.fillStyle = "#0A0806";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Warm radial gradient
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2,
        Math.max(canvas.width, canvas.height) * 0.5
    );
    gradient.addColorStop(0, "rgba(20, 16, 12, 0.4)");
    gradient.addColorStop(1, "rgba(10, 8, 6, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

export default function ScrollytellingCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Use refs instead of state — avoids stale-closure bug in useMotionValueEvent
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const loadedRef = useRef<boolean[]>(new Array(TOTAL_FRAMES).fill(false));
    const currentFrameRef = useRef(0);

    const { scrollYProgress } = useScroll();
    const frameIndex = useTransform(scrollYProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

    // Canvas sizing
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Redraw current frame after resize
            const img = imagesRef.current[currentFrameRef.current];
            if (img && loadedRef.current[currentFrameRef.current]) {
                const ctx = canvas.getContext("2d");
                if (ctx) drawImageCentered(ctx, img, canvas);
            }
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    // Pre-load all frames into refs
    useEffect(() => {
        const imgs: HTMLImageElement[] = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
            const img = new window.Image();
            img.src = `/sequence/ezgif-frame-${(i + 1).toString().padStart(3, "0")}.jpg`;
            img.onload = () => {
                loadedRef.current[i] = true;
                // Paint frame 0 as soon as it arrives
                if (i === 0 && canvasRef.current) {
                    const ctx = canvasRef.current.getContext("2d");
                    if (ctx) drawImageCentered(ctx, img, canvasRef.current);
                }
            };
            return img;
        });
        imagesRef.current = imgs;
    }, []);

    // Paint the correct frame on scroll
    useMotionValueEvent(frameIndex, "change", (latest) => {
        const idx = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(latest)));
        currentFrameRef.current = idx;
        const canvas = canvasRef.current;
        const img = imagesRef.current[idx];
        if (!canvas || !img || !loadedRef.current[idx]) return;
        const ctx = canvas.getContext("2d");
        if (ctx) drawImageCentered(ctx, img, canvas);
    });

    return (
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#0A0806] -z-10">
            <canvas ref={canvasRef} className="block w-full h-full" />
            {/* Soft vignette to blend any potential hard edges */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(10,8,6,1)]" />
        </div>
    );
}
