import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "output: export" removed — API routes require a Node.js runtime (deploy to Vercel/Railway/etc.)
  images: { unoptimized: true },
};

export default nextConfig;
