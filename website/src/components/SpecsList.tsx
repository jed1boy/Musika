import { Check } from "lucide-react";

export function SpecsList() {
  const specs = [
    { category: "Playback", items: ["Gapless Transitions", "Crossfade Support", "Pitch & Speed Control", "Background Service", "Sleep Timer"] },
    { category: "Ecosystem", items: ["Android Auto", "Wear OS Limited", "Chromecast", "DLNA/UPnP Discovery", "Bluetooth Metadata"] },
    { category: "Discovery", items: ["Audio Recognition", "Smart Suggestions", "Trending Charts", "Moods & Genres", "Universal Search"] },
    { category: "Library", items: ["YouTube Music Sync", "Local Playlists", "Import/Export", "Collaborative Playlists", "Offline Cache"] }
  ];

  return (
    <section className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-24 md:py-40">
      <div className="mb-16 md:mb-24">
        <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-6 text-balance">
          Built for enthusiasts.
        </h2>
        <p className="text-xl md:text-2xl text-white/50 max-w-2xl font-light">
          A comprehensive feature set that rivals premium platforms, built entirely on open-source principles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8">
        {specs.map((spec, i) => (
          <div key={i} className="flex flex-col">
            <h3 className="text-sm font-bold tracking-widest uppercase text-white/40 mb-8 border-b border-white/10 pb-4">
              {spec.category}
            </h3>
            <ul className="flex flex-col gap-5">
              {spec.items.map((item, j) => (
                <li key={j} className="flex items-start gap-3 text-lg md:text-xl font-light text-white/80">
                  <Check size={20} className="mt-1 text-white/30 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}