"use client";

import { Github, Coffee } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 p-4 md:p-8 pointer-events-none transition-[opacity,transform] duration-300 ease-out-ui motion-reduce:duration-150 ${
        isScrolled ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-center gap-4">
        <a 
          href="https://github.com/jed1boy/Musika" 
          target="_blank"
          rel="noreferrer"
          className="marketing-nav-pill-github pointer-events-auto flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 md:py-2.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full transition-[background-color,color] duration-200 ease-out-ui"
        >
          <Github size={16} className="md:w-[18px] md:h-[18px]" />
          <span className="text-xs md:text-sm font-medium tracking-wide">Star on GitHub</span>
        </a>
        
        <a 
          href="https://buymeacoffee.com/jzee" 
          target="_blank"
          rel="noreferrer"
          className="marketing-nav-pill-coffee pointer-events-auto flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 md:py-2.5 bg-[#FFDD00]/10 text-[#FFDD00] backdrop-blur-md border border-[#FFDD00]/20 rounded-full transition-[background-color,color] duration-200 ease-out-ui"
        >
          <Coffee size={16} className="md:w-[18px] md:h-[18px]" />
          <span className="text-xs md:text-sm font-medium tracking-wide text-white">Buy me a coffee</span>
        </a>
      </div>
    </nav>
  );
}