"use client";

import { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    radius: number;
    velocity: number;
    opacity: number;
}

export default function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Configuration
        const PARTICLE_COUNT = 40;
        const PARTICLE_COLOR = "#C9A84C";
        let animationFrameId: number;
        let particles: Particle[] = [];

        // Dynamic Resize Handler
        const resizeCanvas = () => {
            // Use parent element's actual layout bounds for crisp rendering
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            } else {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };

        // Initial Layout sync
        resizeCanvas();

        // Seed Particle Array
        const initParticles = () => {
            particles = [];
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    // radius: 1px to 2.5px
                    radius: Math.random() * 1.5 + 1,
                    // upward drift velocity: 0.2 to 1.0 px/frame
                    velocity: Math.random() * 0.8 + 0.2,
                    // opacity: 0.1 to 0.8
                    opacity: Math.random() * 0.7 + 0.1,
                });
            }
        };

        initParticles();

        // High-Performance Native Render Loop
        const renderLoop = () => {
            // Clear entire canvas frame efficiently
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update & Paint each particle
            for (let i = 0; i < particles.length; i++) {
                let p = particles[i];

                // Drift upward
                p.y -= p.velocity;

                // Reset logic if perfectly pushed off the top bounding box
                if (p.y + p.radius < 0) {
                    p.y = canvas.height + p.radius;
                    p.x = Math.random() * canvas.width;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2, false);
                // Dynamically compile the hex color with local alpha
                ctx.fillStyle = `${PARTICLE_COLOR}${Math.floor(p.opacity * 255).toString(16).padStart(2, '0')}`;
                ctx.fill();
            }

            // Bind next frame to browser render cycle
            animationFrameId = requestAnimationFrame(renderLoop);
        };

        renderLoop();

        // Bind Resize Observer logic natively
        window.addEventListener("resize", resizeCanvas);

        // EXPLICIT MEMORY CLEANUP
        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            aria-hidden="true"
        />
    );
}
