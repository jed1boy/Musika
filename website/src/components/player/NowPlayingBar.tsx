"use client";

import { useState } from "react";
import { ListMusic, Mic2, X } from "lucide-react";
import { AlbumArt } from "./AlbumArt";
import { formatArtists } from "@/lib/player/format-artists";
import { trackThumbnailUrl } from "@/lib/player/thumbnail-url";
import { usePlayerState, usePlayerActions } from "./PlayerProvider";
import { PlaybackControls, SeekBar, VolumeControl } from "./Controls";
import { ListenSidePanel, type SidePanelTab } from "./ListenSidePanel";

export function NowPlayingBar() {
  const state = usePlayerState();
  const actions = usePlayerActions();
  const [sideOpen, setSideOpen] = useState(false);
  const [sideTab, setSideTab] = useState<SidePanelTab>("queue");

  const toggleSide = (tab: SidePanelTab) => {
    if (sideOpen && sideTab === tab) setSideOpen(false);
    else {
      setSideTab(tab);
      setSideOpen(true);
    }
  };

  if (!state.currentTrack) return null;

  const artistLine = formatArtists(state.currentTrack);

  const panelBtn = (active: boolean) =>
    `min-h-10 min-w-10 flex items-center justify-center rounded-full transition-colors duration-150 ease-out motion-reduce:transition-none ${
      active
        ? "text-white bg-white/[0.12]"
        : "text-white/45 hover:text-white/80 hover:bg-white/[0.06] active:bg-white/[0.1]"
    }`;

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div className="max-w-[1440px] mx-auto px-3 md:px-6 pb-3 md:pb-4">
          <div className="pointer-events-auto bg-[#0a0a0a]/92 backdrop-blur-2xl border border-white/[0.08] rounded-[20px] md:rounded-2xl px-4 md:px-6 py-3 md:py-4 shadow-2xl shadow-black/60">
            {state.playbackError && (
              <div className="flex items-start gap-2 mb-3 px-0.5">
                <p className="flex-1 text-xs text-amber-200/90 leading-snug">
                  {state.playbackError}
                </p>
                <button
                  type="button"
                  onClick={() => actions.clearPlaybackError()}
                  className="min-h-8 min-w-8 flex items-center justify-center rounded-md text-white/40 hover:text-white/70 hover:bg-white/10 shrink-0 transition-colors duration-150 ease-out"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Desktop: seek row first (YTM-style), then meta / controls / volume */}
            <div className="hidden md:flex flex-col gap-3.5">
              <SeekBar variant="chrome" />
              <div className="flex items-center gap-4 lg:gap-6">
                <div className="flex items-center gap-3.5 min-w-0 flex-1 max-w-[min(38vw,340px)]">
                  <AlbumArt
                    src={trackThumbnailUrl(state.currentTrack)}
                    alt=""
                    width={52}
                    height={52}
                    sizes="52px"
                    className="rounded-xl shadow-lg shadow-black/50 ring-1 ring-white/[0.08] shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate tracking-tight">
                      {state.currentTrack.title}
                    </p>
                    <p className="text-xs text-white/45 truncate mt-0.5">
                      {artistLine || "\u2014"}
                    </p>
                  </div>
                </div>

                <div className="flex-1 flex justify-center min-w-0 px-2">
                  <PlaybackControls />
                </div>

                <div className="flex items-center justify-end gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleSide("lyrics")}
                    className={panelBtn(sideOpen && sideTab === "lyrics")}
                    aria-label="Lyrics"
                  >
                    <Mic2 size={18} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSide("queue")}
                    className={panelBtn(sideOpen && sideTab === "queue")}
                    aria-label="Queue"
                  >
                    <ListMusic size={18} strokeWidth={1.75} />
                  </button>
                  <div className="pl-1">
                    <VolumeControl />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile */}
            <div className="md:hidden flex flex-col gap-3">
              <SeekBar variant="chrome" />
              <div className="flex items-center gap-3">
                <AlbumArt
                  src={trackThumbnailUrl(state.currentTrack)}
                  alt=""
                  width={44}
                  height={44}
                  sizes="44px"
                  className="rounded-[10px] shadow-md shadow-black/40 ring-1 ring-white/[0.08] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {state.currentTrack.title}
                  </p>
                  <p className="text-xs text-white/45 truncate mt-0.5">
                    {artistLine || "\u2014"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSide("lyrics")}
                  className={panelBtn(sideOpen && sideTab === "lyrics")}
                  aria-label="Lyrics"
                >
                  <Mic2 size={17} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleSide("queue")}
                  className={panelBtn(sideOpen && sideTab === "queue")}
                  aria-label="Queue"
                >
                  <ListMusic size={17} strokeWidth={1.75} />
                </button>
              </div>
              <div className="flex justify-center pt-0.5">
                <PlaybackControls />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ListenSidePanel
        open={sideOpen}
        onClose={() => setSideOpen(false)}
        tab={sideTab}
        onTabChange={setSideTab}
      />
    </>
  );
}
