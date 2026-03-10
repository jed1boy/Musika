"use client";

import { Download, ArrowRight } from "lucide-react";

interface DownloadButtonProps {
  apkUrl: string | null;
}

export function DownloadButton({ apkUrl }: DownloadButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!apkUrl) {
      e.preventDefault();
      window.location.href = "https://github.com/jed1boy/Musika/releases/latest";
    }
  };

  return (
    <a
      href={apkUrl || "https://github.com/jed1boy/Musika/releases/latest"}
      onClick={handleClick}
      className="group relative flex items-center justify-between gap-4 md:gap-6 px-6 md:px-8 py-4 md:py-5 bg-white text-black rounded-[28px] md:rounded-[32px] overflow-hidden hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 ease-out w-full sm:w-auto"
    >
      <div className="flex items-center gap-3">
        <Download size={22} strokeWidth={2} className="opacity-80" />
        <span className="text-base md:text-lg font-semibold tracking-tight">
          {apkUrl ? "Download Latest" : "View Releases"}
        </span>
      </div>
      
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-[12px] md:rounded-[14px] bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors duration-300 ml-2">
        <ArrowRight size={18} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform duration-300" />
      </div>
    </a>
  );
}