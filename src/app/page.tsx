import Navbar from "@/components/Navbar";
import ScrollytellingCanvas from "@/components/ScrollytellingCanvas";
import StorytellingOverlay from "@/components/StorytellingOverlay";
import HeroSection from "@/components/HeroSection";
import InstagramGrid from "@/components/InstagramGrid";
import ProductSection from "@/components/ProductSection";
import BrandStory from "@/components/BrandStory";
import CTASection from "@/components/CTASection";

export default function Home() {
  return (
    <main className="relative bg-[#0A0806] text-[#EBE5D9]">
      <Navbar />

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
      <InstagramGrid />
      <ProductSection />
      <BrandStory />
      <CTASection />
    </main>
  );
}

