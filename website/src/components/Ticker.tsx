export function Ticker() {
  const words = [
    "AD-FREE EXPERIENCE", "GAPLESS PLAYBACK", "OFFLINE MODE", "SYNCED LYRICS",
    "AUDIO RECOGNITION", "DLNA / UPNP CASTING", "MULTIPLE ACCOUNTS", "CHROMECAST",
    "ANDROID AUTO", "NO TRACKING"
  ];
  
  // Duplicate for seamless infinite scrolling
  const items = [...words, ...words, ...words];

  return (
    <div className="w-full overflow-hidden bg-white text-black py-4 md:py-6 rotate-[-1deg] scale-105 my-20">
      <div className="flex whitespace-nowrap animate-marquee">
        {items.map((word, i) => (
          <div key={i} className="flex items-center">
            <span className="text-2xl md:text-4xl font-bold tracking-tighter uppercase px-8">
              {word}
            </span>
            <span className="w-2 h-2 md:w-3 md:h-3 bg-black rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}