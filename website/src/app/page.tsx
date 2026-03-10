import { DownloadButton } from "@/components/DownloadButton";
import { Navbar } from "@/components/Navbar";
import { Ticker } from "@/components/Ticker";
import { SpecsList } from "@/components/SpecsList";
import { FinalCTA } from "@/components/FinalCTA";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { getLatestReleaseApkUrl } from "@/lib/github";
import { Music, Radio, CloudOff, Mic2 } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Musika - Open Source Music Streaming",
  description: "A robust, open-source music streaming client offering an ad-free experience, offline capabilities, and advanced music discovery.",
};

export default async function Home() {
  const apkUrl = await getLatestReleaseApkUrl();

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
      <Navbar />
      
      {/* Dynamic ambient background layer */}
      <div className="absolute top-0 inset-x-0 h-[600px] md:h-[800px] w-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/[0.06] via-black to-black -z-10 pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 py-12 md:py-32 flex flex-col gap-16 md:gap-40">
        
        {/* Editorial Hero: Massive Typography & Asymmetrical CTA */}
        <section className="relative flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 md:gap-16 pt-4 md:pt-10">
          <div className="flex-1 w-full max-w-5xl z-10">
            <h1 className="text-[20vw] sm:text-[16vw] xl:text-[180px] leading-[0.8] md:leading-[0.85] font-semibold tracking-tighter -ml-1 md:-ml-2 xl:-ml-4 text-white">
              MUSIKA
            </h1>
            <p className="mt-6 md:mt-12 text-xl sm:text-2xl md:text-4xl text-white/50 max-w-2xl font-light tracking-tight leading-snug">
              The uncompromising, <br className="hidden sm:block" />
              <span className="text-white">ad-free</span> music experience.
            </p>
          </div>
          
          <div className="flex-none xl:pb-6 w-full sm:w-auto z-20">
            <DownloadButton apkUrl={apkUrl} />
          </div>
        </section>

        {/* Interactive Feature Showcase replacing the huge static blocks */}
        <FeatureShowcase />

        {/* Feature Row 4 - Floating Statistics/Data points */}
        <section className="w-full flex flex-col md:flex-row gap-6 md:gap-12 mt-12 md:mt-24 mb-12">
          <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[40px] p-10 flex flex-col items-center text-center justify-center min-h-[300px]">
            <h3 className="text-6xl md:text-8xl font-bold tracking-tighter mb-4">0</h3>
            <p className="text-xl text-white/50 font-light tracking-wide uppercase">Advertisements</p>
          </div>
          <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[40px] p-10 flex flex-col items-center text-center justify-center min-h-[300px]">
            <h3 className="text-6xl md:text-8xl font-bold tracking-tighter mb-4">100<span className="text-4xl text-white/30">%</span></h3>
            <p className="text-xl text-white/50 font-light tracking-wide uppercase">Open Source</p>
          </div>
          <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[40px] p-10 flex flex-col items-center text-center justify-center min-h-[300px]">
            <h3 className="text-6xl md:text-8xl font-bold tracking-tighter mb-4">∞</h3>
            <p className="text-xl text-white/50 font-light tracking-wide uppercase">Library Access</p>
          </div>
        </section>

      </div>

      {/* Infinite Scrolling Ticker */}
      <Ticker />

      {/* Deep Specs Section */}
      <SpecsList />

      {/* Massive Bottom CTA */}
      <FinalCTA apkUrl={apkUrl} />
      
      {/* Footer */}
      <footer className="w-full border-t border-white/10 py-12 md:py-16 mt-12 md:mt-20 text-center">
        <p className="text-white/40 text-[10px] md:text-sm font-medium tracking-widest uppercase">
          Built on open-source • Licensed under GPL-3.0
        </p>
      </footer>
    </main>
  );
}