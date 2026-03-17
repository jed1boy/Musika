"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, X, Loader2 } from "lucide-react";
import { usePlayerState } from "./PlayerProvider";
import { getLyrics } from "@/lib/player/api";
import type { LyricsLine } from "@/lib/player/types";

interface LyricsPanelProps {
  open: boolean;
  onClose: () => void;
}

function findCurrentLine(lines: LyricsLine[], positionMs: number): number {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time >= positionMs + 300) return i - 1;
  }
  return lines.length - 1;
}

export function LyricsPanel({ open, onClose }: LyricsPanelProps) {
  const state = usePlayerState();
  const [lines, setLines] = useState<LyricsLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTrackId = useRef<string | null>(null);

  const trackId = state.currentTrack?.id;

  useEffect(() => {
    if (!open || !state.currentTrack) return;
    if (lastTrackId.current === state.currentTrack.id) return;
    lastTrackId.current = state.currentTrack.id;
    const track = state.currentTrack;

    let cancelled = false;
    setLoading(true);
    setError(false);
    setLines([]);

    getLyrics(
      track.title,
      track.artists.map((a) => a.name).join(", "),
      track.duration
    )
      .then((result) => {
        if (!cancelled) setLines(result.lines);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, trackId]);

  const positionMs = state.currentTime * 1000;
  const currentIdx = lines.length > 0 ? findCurrentLine(lines, positionMs) : -1;

  useEffect(() => {
    if (!open || currentIdx < 0) return;
    const el = containerRef.current?.querySelector(`[data-line="${currentIdx}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentIdx, open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-neutral-950 border-l border-white/10 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Mic2 size={18} className="text-white/50" />
                <h2 className="text-lg font-medium tracking-tight">Lyrics</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-white/40 hover:text-white/70 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div ref={containerRef} className="flex-1 overflow-y-auto overscroll-contain px-6 py-8">
              {loading && (
                <div className="flex items-center justify-center h-40">
                  <Loader2 size={24} className="animate-spin text-white/30" />
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center h-40 text-white/20">
                  <Mic2 size={32} strokeWidth={1} />
                  <p className="mt-3 text-sm">No lyrics available</p>
                </div>
              )}

              {!loading && !error && lines.length > 0 && (
                <div className="flex flex-col gap-4">
                  {lines.map((line, i) => (
                    <p
                      key={i}
                      data-line={i}
                      className={`text-lg md:text-xl font-medium leading-relaxed transition-all duration-300 ${
                        i === currentIdx
                          ? "text-white scale-[1.02] origin-left"
                          : i < currentIdx
                            ? "text-white/20"
                            : "text-white/40"
                      }`}
                    >
                      {line.text}
                    </p>
                  ))}
                </div>
              )}

              {!loading && !error && lines.length === 0 && state.currentTrack && (
                <div className="flex flex-col items-center justify-center h-40 text-white/20">
                  <Mic2 size={32} strokeWidth={1} />
                  <p className="mt-3 text-sm">No synced lyrics found</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
