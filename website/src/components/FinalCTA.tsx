interface FinalCTAProps {
  apkUrl: string | null;
}

export function FinalCTA({ apkUrl }: FinalCTAProps) {
  return (
    <section className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-24 md:py-40 flex flex-col items-center justify-center text-center">
      <div className="w-full bg-white text-black rounded-[48px] md:rounded-[80px] p-12 md:p-32 flex flex-col items-center">
        <h2 className="text-5xl md:text-[100px] leading-[0.9] font-semibold tracking-tighter mb-8 max-w-4xl text-balance">
          READY TO LISTEN?
        </h2>
        <p className="text-xl md:text-3xl text-black/60 font-light mb-12 max-w-2xl">
          Get the ultimate ad-free music experience today, completely open-source.
        </p>
        
        {/* We invert the colors for the button here since background is white */}
        <div className="relative group">
          <a
            href={apkUrl || "https://github.com/jed1boy/Musika/releases/latest"}
            className="marketing-final-cta-btn flex items-center justify-center gap-4 px-8 py-5 bg-black text-white rounded-[32px] overflow-hidden active:scale-[0.97] transition-[transform,background-color] duration-200 ease-out-ui text-lg font-semibold tracking-tight"
          >
            {apkUrl ? "Download Latest APK" : "View on GitHub"}
          </a>
        </div>
      </div>
    </section>
  );
}