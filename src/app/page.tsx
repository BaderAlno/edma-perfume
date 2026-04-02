
import ScrollytellingCanvas from "@/components/ScrollytellingCanvas";
import StorytellingOverlay from "@/components/StorytellingOverlay";
import HeroSection from "@/components/HeroSection";
import MarqueeTicker from "@/components/MarqueeTicker";
import InstagramGrid from "@/components/InstagramGrid";
import ProductSection from "@/components/ProductSection";
import BrandStory from "@/components/BrandStory";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import CinematicSection from "@/components/CinematicSection";

export default function Home() {
  return (
    <main className="relative bg-[#0A0806] text-[#EBE5D9]">
      {/* 
        This wrapper creates the scroll bounds (500vh). 
        The canvas and text overlay are `sticky`, so they 
        will stay fixed in the viewport while scrolling through 500vh.
      */}
      <div className="relative h-[500vh] w-full">
        <ScrollytellingCanvas />
        <StorytellingOverlay />
      </div>

      {/* Arabic Luxury Sections */}
      <HeroSection />
      <MarqueeTicker />
      <InstagramGrid />
      {/* Scroll-driven cinematic video — place your video at public/hero-cinematic.mp4 */}
      <CinematicSection />
      <ProductSection />
      <BrandStory />
      <TestimonialsSection />
      <CTASection />
    </main>
  );
}

