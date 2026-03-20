"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListMusic, Mic2, X, Loader2 } from "lucide-react";
import { AlbumArt } from "./AlbumArt";
import { formatArtists } from "@/lib/player/format-artists";
import { trackThumbnailUrl } from "@/lib/player/thumbnail-url";
import { usePlayerState, usePlayerActions } from "./PlayerProvider";
import { getLyrics } from "@/lib/player/api";
import type { LyricsLine } from "@/lib/player/types";

export type SidePanelTab = "queue" | "lyrics";

interface ListenSidePanelProps {
  open: boolean;
  onClose: () => void;
  tab: SidePanelTab;
  onTabChange: (t: SidePanelTab) => void;
}

function formatDuration(seconds?: number) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function findCurrentLine(lines: LyricsLine[], positionMs: number): number {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time >= positionMs + 300) return i - 1;
  }
  return lines.length - 1;
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-4 py-3 text-[11px] font-semibold tracking-[0.16em] uppercase transition-colors duration-150 ease-out border-b-2 -mb-px min-h-11 ${
        active
          ? "text-white border-white"
          : "text-white/35 border-transparent hover:text-white/55"
      }`}
    >
      {children}
    </button>
  );
}

/** Right sheet with YouTube Music–style UP NEXT / LYRICS tabs. */
export function ListenSidePanel({
  open,
  onClose,
  tab,
  onTabChange,
}: ListenSidePanelProps) {
  const state = usePlayerState();
  const actions = usePlayerActions();
  const upcoming = state.queue.slice(state.queueIndex + 1);

  const [lines, setLines] = useState<LyricsLine[]>([]);
  const [lyricsPlain, setLyricsPlain] = useState("");
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lyricsCacheRef = useRef<
    Map<string, { lines: LyricsLine[]; plain: string }>
  >(new Map());

  /** Always-latest track for effects; never put `currentTrack` in dependency arrays (object identity + HMR break hook arity rules). */
  const currentTrackRef = useRef(state.currentTrack);
  currentTrackRef.current = state.currentTrack;

  const trackId = state.currentTrack?.id ?? "";

  useEffect(() => {
    if (!open || tab !== "lyrics") return;
    const track = currentTrackRef.current;
    if (!track?.id) return;
    const id = track.id;

    const cached = lyricsCacheRef.current.get(id);
    if (cached) {
      setLines(cached.lines);
      setLyricsPlain(cached.plain);
      setLyricsError(false);
      setLyricsLoading(false);
      return;
    }

    let cancelled = false;
    setLyricsLoading(true);
    setLyricsError(false);
    setLines([]);
    setLyricsPlain("");

    getLyrics(track.title, formatArtists(track) || "Unknown", track.duration)
      .then((result) => {
        if (cancelled) return;
        const plain =
          result.lines.length === 0 && result.raw?.trim()
            ? result.raw.trim()
            : "";
        lyricsCacheRef.current.set(id, { lines: result.lines, plain });
        setLines(result.lines);
        setLyricsPlain(plain);
      })
      .catch(() => {
        if (!cancelled) setLyricsError(true);
      })
      .finally(() => {
        if (!cancelled) setLyricsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, tab, trackId]);

  const positionMs = state.currentTime * 1000;
  const currentIdx =
    lines.length > 0 ? findCurrentLine(lines, positionMs) : -1;

  useEffect(() => {
    if (!open || tab !== "lyrics" || currentIdx < 0) return;
    const el = lyricsContainerRef.current?.querySelector(
      `[data-line="${currentIdx}"]`
    );
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentIdx, open, tab]);

  const onBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 bg-black/70 z-40 md:hidden"
            onClick={onBackdrop}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-[#0a0a0a] border-l border-white/[0.08] z-50 flex flex-col shadow-[-12px_0_48px_rgba(0,0,0,0.5)]"
            role="dialog"
            aria-label="Queue and lyrics"
          >
            <div className="flex items-stretch justify-between gap-2 border-b border-white/[0.08] px-2 shrink-0">
              <div className="flex" role="tablist">
                <TabButton
                  active={tab === "queue"}
                  onClick={() => onTabChange("queue")}
                >
                  Up next
                </TabButton>
                <TabButton
                  active={tab === "lyrics"}
                  onClick={() => onTabChange("lyrics")}
                >
                  Lyrics
                </TabButton>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 min-w-11 flex items-center justify-center text-white/40 hover:text-white/75 transition-colors duration-150 ease-out rounded-lg hover:bg-white/[0.06] shrink-0"
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </div>

            {tab === "queue" && (
              <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
                {state.currentTrack && (
                  <div className="px-4 pt-5 pb-2">
                    <p className="text-[11px] font-semibold text-white/35 uppercase tracking-[0.18em] mb-3">
                      Playing from queue
                    </p>
                    <div className="flex items-center gap-3.5 p-3.5 bg-white/[0.05] rounded-2xl ring-1 ring-white/[0.06]">
                      <AlbumArt
                        src={trackThumbnailUrl(state.currentTrack)}
                        alt=""
                        width={48}
                        height={48}
                        sizes="48px"
                        className="rounded-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate leading-tight">
                          {state.currentTrack.title}
                        </p>
                        <p className="text-xs text-white/45 truncate mt-1">
                          {formatArtists(state.currentTrack) || "\u2014"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {upcoming.length > 0 && (
                  <div className="px-4 pt-2 pb-24">
                    <p className="text-[11px] font-semibold text-white/35 uppercase tracking-[0.18em] mb-3">
                      Up next &middot; {upcoming.length}
                    </p>
                    <div className="flex flex-col gap-1">
                      {upcoming.map((track) => (
                        <div
                          key={track.queueId}
                          className="group flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors duration-150 ease-out"
                        >
                          <AlbumArt
                            src={trackThumbnailUrl(track)}
                            alt=""
                            width={40}
                            height={40}
                            sizes="40px"
                            className="rounded-lg shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white/90 truncate">
                              {track.title}
                            </p>
                            <p className="text-xs text-white/40 truncate mt-0.5">
                              {formatArtists(track) || "\u2014"}
                            </p>
                          </div>
                          <span className="text-xs text-white/30 tabular-nums shrink-0">
                            {formatDuration(track.duration)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              actions.removeFromQueue(track.queueId)
                            }
                            className="min-h-9 min-w-9 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-white/35 hover:text-white/70 hover:bg-white/[0.08]"
                            aria-label="Remove from queue"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {upcoming.length === 0 && state.currentTrack && (
                  <div className="px-4 pb-24 pt-2 text-center text-white/30 text-sm">
                    Nothing else in queue
                  </div>
                )}

                {upcoming.length === 0 && !state.currentTrack && (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] text-white/25 px-6">
                    <ListMusic size={44} strokeWidth={1} />
                    <p className="mt-4 text-sm">Queue is empty</p>
                  </div>
                )}
              </div>
            )}

            {tab === "lyrics" && (
              <div
                ref={lyricsContainerRef}
                className="flex-1 overflow-y-auto overscroll-contain px-6 py-8 min-h-0"
              >
                {lyricsLoading && (
                  <div className="flex items-center justify-center h-48">
                    <Loader2
                      size={24}
                      className="animate-spin text-white/25"
                    />
                  </div>
                )}

                {lyricsError && (
                  <div className="flex flex-col items-center justify-center h-48 text-white/25">
                    <Mic2 size={32} strokeWidth={1} />
                    <p className="mt-3 text-sm">No lyrics available</p>
                  </div>
                )}

                {!lyricsLoading &&
                  !lyricsError &&
                  lines.length > 0 &&
                  lines.map((line, i) => (
                    <p
                      key={i}
                      data-line={i}
                      className={`text-base md:text-lg font-medium leading-relaxed mb-4 transition-colors duration-200 ease-out ${
                        i === currentIdx
                          ? "text-white"
                          : i < currentIdx
                            ? "text-white/25"
                            : "text-white/45"
                      }`}
                    >
                      {line.text}
                    </p>
                  ))}

                {!lyricsLoading &&
                  !lyricsError &&
                  lines.length === 0 &&
                  lyricsPlain && (
                    <p className="text-base md:text-lg text-white/55 font-normal leading-relaxed whitespace-pre-wrap">
                      {lyricsPlain}
                    </p>
                  )}

                {!lyricsLoading &&
                  !lyricsError &&
                  lines.length === 0 &&
                  !lyricsPlain &&
                  state.currentTrack && (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] text-white/25 px-2">
                      <Mic2 size={32} strokeWidth={1} />
                      <p className="mt-3 text-sm text-center">
                        No lyrics found for this track
                      </p>
                    </div>
                  )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
