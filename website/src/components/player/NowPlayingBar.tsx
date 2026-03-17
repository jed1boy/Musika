"use client";

import { useState } from "react";
import Image from "next/image";
import { ListMusic, Mic2 } from "lucide-react";
import { usePlayerState } from "./PlayerProvider";
import { PlaybackControls, SeekBar, VolumeControl } from "./Controls";
import { QueuePanel } from "./QueuePanel";
import { LyricsPanel } from "./LyricsPanel";

export function NowPlayingBar() {
  const state = usePlayerState();
  const [queueOpen, setQueueOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);

  if (!state.currentTrack) return null;

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div className="max-w-[1440px] mx-auto px-3 md:px-6 pb-3 md:pb-4">
          <div className="pointer-events-auto bg-neutral-950/90 backdrop-blur-2xl border border-white/10 rounded-[20px] md:rounded-[24px] px-4 md:px-6 py-3 md:py-4 shadow-2xl shadow-black/50">
            {/* Desktop layout */}
            <div className="hidden md:flex items-center gap-6">
              {/* Track info */}
              <div className="flex items-center gap-4 w-64 shrink-0">
                {state.currentTrack.thumbnail && (
                  <Image
                    src={state.currentTrack.thumbnail}
                    alt=""
                    width={48}
                    height={48}
                    unoptimized
                    className="w-12 h-12 rounded-[10px] object-cover bg-white/5"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {state.currentTrack.title}
                  </p>
                  <p className="text-xs text-white/40 truncate">
                    {state.currentTrack.artists.map((a) => a.name).join(", ")}
                  </p>
                </div>
              </div>

              {/* Center controls */}
              <div className="flex-1 flex flex-col items-center gap-1.5 max-w-2xl mx-auto">
                <PlaybackControls />
                <SeekBar />
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-2 w-64 justify-end shrink-0">
                <button
                  onClick={() => { setLyricsOpen(!lyricsOpen); setQueueOpen(false); }}
                  className={`p-2 rounded-full transition-colors ${
                    lyricsOpen ? "text-white bg-white/10" : "text-white/40 hover:text-white/70"
                  }`}
                  aria-label="Lyrics"
                >
                  <Mic2 size={18} />
                </button>
                <button
                  onClick={() => { setQueueOpen(!queueOpen); setLyricsOpen(false); }}
                  className={`p-2 rounded-full transition-colors ${
                    queueOpen ? "text-white bg-white/10" : "text-white/40 hover:text-white/70"
                  }`}
                  aria-label="Queue"
                >
                  <ListMusic size={18} />
                </button>
                <VolumeControl />
              </div>
            </div>

            {/* Mobile layout */}
            <div className="md:hidden flex flex-col gap-2">
              <div className="flex items-center gap-3">
                {state.currentTrack.thumbnail && (
                  <Image
                    src={state.currentTrack.thumbnail}
                    alt=""
                    width={40}
                    height={40}
                    unoptimized
                    className="w-10 h-10 rounded-[8px] object-cover bg-white/5"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {state.currentTrack.title}
                  </p>
                  <p className="text-xs text-white/40 truncate">
                    {state.currentTrack.artists.map((a) => a.name).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setLyricsOpen(!lyricsOpen); setQueueOpen(false); }}
                    className={`p-1.5 rounded-full ${lyricsOpen ? "text-white" : "text-white/40"}`}
                  >
                    <Mic2 size={16} />
                  </button>
                  <button
                    onClick={() => { setQueueOpen(!queueOpen); setLyricsOpen(false); }}
                    className={`p-1.5 rounded-full ${queueOpen ? "text-white" : "text-white/40"}`}
                  >
                    <ListMusic size={16} />
                  </button>
                </div>
              </div>
              <SeekBar />
              <div className="flex justify-center">
                <PlaybackControls />
              </div>
            </div>
          </div>
        </div>
      </div>

      <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />
      <LyricsPanel open={lyricsOpen} onClose={() => setLyricsOpen(false)} />
    </>
  );
}
