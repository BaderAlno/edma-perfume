"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, useMotionValueEvent } from "framer-motion";

const TOTAL_FRAMES = 240;

export default function ScrollytellingCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const { scrollYProgress } = useScroll();

    // Load images
    useEffect(() => {
        const loadedImages: HTMLImageElement[] = [];
        let loadedCount = 0;

        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const img = new Image();
            const frameNumber = i.toString().padStart(3, "0");
            img.src = `/sequence/ezgif-frame-${frameNumber}.jpg`;
            img.onload = () => {
                loadedCount++;
                // Draw the first frame perfectly once loaded
                if (loadedCount === 1 && canvasRef.current && i === 1) {
                    const ctx = canvasRef.current.getContext("2d");
                    if (ctx) {
                        drawImageCentered(ctx, img, canvasRef.current);
                    }
                }
            };
            loadedImages.push(img);
        }
        setImages(loadedImages);
    }, []);

    // Set the canvas to window size and handle resizing
    useEffect(() => {
        const initCanvas = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };

        initCanvas();

        const handleResize = () => {
            initCanvas();
            if (canvasRef.current && images.length > 0) {
                const index = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(frameIndex.get())));
                const ctx = canvasRef.current.getContext("2d");
                const img = images[index];
                if (ctx && img && img.complete) {
                    drawImageCentered(ctx, img, canvasRef.current);
                }
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [images]);

    // Frame index based on scroll
    const frameIndex = useTransform(scrollYProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

    useMotionValueEvent(frameIndex, "change", (latest) => {
        if (!canvasRef.current || images.length === 0) return;
        const index = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(latest)));
        const img = images[index];
        const ctx = canvasRef.current.getContext("2d");
        if (ctx && img && img.complete) {
            drawImageCentered(ctx, img, canvasRef.current);
        }
    });

    // Utility to draw the image centered without distorting AR
    const drawImageCentered = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, canvas: HTMLCanvasElement) => {
        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.width / img.height;

        let drawWidth, drawHeight, offsetX, offsetY;

        // We scale the image down so it entirely fits if it's too large, but typically we want it to cover the screen vertically
        if (canvasRatio > imgRatio) {
            // Content fits by height constraint
            drawHeight = canvas.height;
            drawWidth = img.width * (canvas.height / img.height);
            offsetX = (canvas.width - drawWidth) / 2;
            offsetY = 0;
        } else {
            // Content fits by width constraint (e.g. mobile)
            drawWidth = canvas.width;
            drawHeight = img.height * (canvas.width / img.width);
            offsetX = 0;
            offsetY = (canvas.height - drawHeight) / 2;
        }

        // Fill background with the pure dark theme color to perfectly blend image edges
        ctx.fillStyle = "#0A0806";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Optional: Draw a subtle warm radial gradient in the center behind the bottle
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.5
        );
        gradient.addColorStop(0, "rgba(20, 16, 12, 0.4)");
        gradient.addColorStop(1, "rgba(10, 8, 6, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    return (
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#0A0806] -z-10">
            <canvas ref={canvasRef} className="block w-full h-full" />
            {/* Soft vignette to blend any potential hard edges */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(10,8,6,1)]" />
        </div>
    );
}
