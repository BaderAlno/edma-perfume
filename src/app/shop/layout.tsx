import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Shop | Luxury Arabian Fragrances",
    description:
        "Explore the EDMA fragrance collection. Elinor (450 SAR), VELOUR (380 SAR), and CECILY (320 SAR) — luxury Arabian perfumes with rare oud, rose, and amber. Free delivery in Saudi Arabia.",
    openGraph: {
        title:       "EDMA Shop | Elinor, VELOUR & CECILY",
        description: "Three luxury Arabian fragrances. Rare oud, rose, amber. Free delivery.",
        images: [{ url: "/Edma-Perf/og-image.jpg", width: 1200, height: 630 }],
    },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
