import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import CustomCursor from "@/components/CustomCursor";
import PageTransition from "@/components/PageTransition";
import CinematicIntro from "@/components/CinematicIntro";
import StickyCartBar from "@/components/StickyCartBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

// ── SEO & Social metadata ─────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "EDMA Perfume | Invisible Elegance, Unforgettable Presence",
    template: "%s | EDMA Perfume",
  },
  description:
    "Discover EDMA's collection of luxury Arabian fragrances. Elinor, VELOUR, and CECILY — handcrafted perfumes with rare leather, cocoa, rose, and musk. Free delivery in Saudi Arabia. أناقة خفية، حضور لا يُنسى.",
  keywords: [
    "luxury perfume", "Arabic fragrance", "oud perfume", "Arabian perfume",
    "عطور فاخرة", "عود", "عطر عربي", "EDMA", "Elinor", "VELOUR", "CECILY",
    "Saudi Arabia", "Saudi perfume", "luxury fragrance",
  ],
  // Set NEXT_PUBLIC_SITE_URL in .env.local to your production domain
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://edmaperfume.com"),
  authors: [{ name: "EDMA Perfume" }],
  creator: "EDMA Perfume",
  publisher: "EDMA Perfume",
  category: "luxury fragrance",

  // Prevent indexing until live — remove for production
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "ar_SA",
    alternateLocale: ["en_US"],
    title: "EDMA Perfume | إدما العطور — أناقة خفية",
    description:
      "Luxury Arabian fragrances handcrafted with rare oud, rose, and amber. Invisible elegance, unforgettable presence. عطور عربية فاخرة.",
    siteName: "EDMA Perfume",
    images: [
      {
        url: "/Edma-Perf/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "EDMA Perfume — Invisible Elegance, Unforgettable Presence",
        type: "image/jpeg",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "EDMA Perfume | إدما العطور",
    description: "Luxury Arabian fragrances. Rare oud, rose, and amber. Free delivery in Saudi Arabia.",
    images: ["/Edma-Perf/og-image.jpg"],
    creator: "@EdmaPerfume",
  },

  icons: {
    icon: "/Edma-Perf/favicon.ico",
    shortcut: "/Edma-Perf/favicon.ico",
    apple: "/Edma-Perf/apple-touch-icon.png",
  },

  // Structured data hints
  other: {
    "og:price:amount": "320",
    "og:price:currency": "SAR",
    "product:brand": "EDMA",
    "product:condition": "new",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0806",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// ── JSON-LD structured data ───────────────────────────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://edmaperfume.com/#organization",
      name: "EDMA Perfume",
      description: "Luxury Arabian fragrance house crafting invisible elegance with rare oud, rose, and amber.",
      url: "https://edmaperfume.com",
      logo: {
        "@type": "ImageObject",
        url: "https://edmaperfume.com/Edma-Perf/og-image.jpg",
      },
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": "https://edmaperfume.com/#website",
      url: "https://edmaperfume.com",
      name: "EDMA Perfume",
      description: "Luxury Arabian Fragrances",
      publisher: { "@id": "https://edmaperfume.com/#organization" },
      inLanguage: ["ar", "en"],
    },
    {
      "@type": "ItemList",
      "@id": "https://edmaperfume.com/#products",
      name: "EDMA Fragrance Collection",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: {
            "@type": "Product",
            name: "Elinor by EDMA",
            description: "A rare oud opening crowned by rose absolute and warm amber base.",
            brand: { "@type": "Brand", name: "EDMA" },
            offers: {
              "@type": "Offer",
              price: "450",
              priceCurrency: "SAR",
              availability: "https://schema.org/InStock",
            },
          },
        },
        {
          "@type": "ListItem",
          position: 2,
          item: {
            "@type": "Product",
            name: "VELOUR by EDMA",
            description: "A luxurious blend of leather, cocoa, saffron, rose, and musk.",
            brand: { "@type": "Brand", name: "EDMA" },
            offers: {
              "@type": "Offer",
              price: "380",
              priceCurrency: "SAR",
              availability: "https://schema.org/InStock",
            },
          },
        },
        {
          "@type": "ListItem",
          position: 3,
          item: {
            "@type": "Product",
            name: "CECILY by EDMA",
            description: "A rare floral signature — jasmine and Bulgarian rose entwined with sandalwood and white musk.",
            brand: { "@type": "Brand", name: "EDMA" },
            offers: {
              "@type": "Offer",
              price: "320",
              priceCurrency: "SAR",
              availability: "https://schema.org/InStock",
            },
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${inter.variable} ${playfair.variable} h-full antialiased bg-brand-primary text-text-champagne scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        {/* Arabic fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans lang-ar relative">
        {/* Accessibility: Skip to main content */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <LanguageProvider>
          <AuthProvider>
            <CurrencyProvider>
              <CartProvider>
                <CinematicIntro />
                <Navbar />
                <CartDrawer />
                <CustomCursor />
                <PageTransition>
                  <div id="main-content" tabIndex={-1}>
                    {children}
                  </div>
                </PageTransition>
                <StickyCartBar />
              </CartProvider>
            </CurrencyProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
