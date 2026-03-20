"use client";

import { AlbumArt } from "./AlbumArt";
import { trackThumbnailUrl } from "@/lib/player/thumbnail-url";
import { formatArtists } from "@/lib/player/format-artists";
import { usePlayerState } from "./PlayerProvider";

/**
 * Large center artwork + title stack (YouTube Music–style main stage) when something is playing.
 */
export function ListenNowPlayingHero() {
  const state = usePlayerState();
  const track = state.currentTrack;
  if (!track) return null;

  const artists = formatArtists(track);

  return (
    <section
      className="relative flex flex-col items-center text-center px-4 pt-2 pb-10 md:pb-14 md:pt-4"
      aria-label="Now playing"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(52vh,420px)] max-h-[480px] opacity-90"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.07),transparent_55%)]" />
      </div>

      <div className="relative w-full max-w-[min(88vw,420px)] aspect-square rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.09]">
        <AlbumArt
          src={trackThumbnailUrl(track)}
          alt=""
          fill
          sizes="(max-width: 768px) 88vw, 420px"
          className="rounded-2xl"
        />
      </div>

      <div className="relative mt-6 md:mt-8 max-w-lg space-y-1.5 px-2">
        <h1 className="text-xl md:text-2xl font-semibold text-white text-balance leading-snug tracking-tight">
          {track.title}
        </h1>
        <p className="text-sm md:text-base text-white/50 font-normal">
          {artists || "\u2014"}
        </p>
      </div>
    </section>
  );
}
