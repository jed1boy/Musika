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
      className="marketing-download-btn group relative flex items-center justify-between gap-4 md:gap-6 px-6 md:px-8 py-4 md:py-5 bg-white text-black rounded-[28px] md:rounded-[32px] overflow-hidden active:scale-[0.97] transition-[transform,background-color] duration-200 ease-out-ui w-full sm:w-auto"
    >
      <div className="flex items-center gap-3">
        <Download size={22} strokeWidth={2} className="opacity-80" />
        <span className="text-base md:text-lg font-semibold tracking-tight">
          {apkUrl ? "Download Latest" : "View Releases"}
        </span>
      </div>

      <div className="marketing-download-btn-icon-wrap w-8 h-8 md:w-10 md:h-10 rounded-[12px] md:rounded-[14px] bg-black/5 flex items-center justify-center transition-[transform,background-color] duration-200 ease-out-ui ml-2">
        <ArrowRight
          size={18}
          strokeWidth={2}
          className="marketing-download-btn-arrow transition-transform duration-200 ease-out-ui"
        />
      </div>
    </a>
  );
}
