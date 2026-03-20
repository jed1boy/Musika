"use client";

import { Play, Plus, Loader2 } from "lucide-react";
import { AlbumArt } from "./AlbumArt";
import type { Track } from "@/lib/player/types";
import { formatArtists } from "@/lib/player/format-artists";
import { trackThumbnailUrl } from "@/lib/player/thumbnail-url";
import { usePlayerActions, usePlayerState } from "./PlayerProvider";

interface TrackRowProps {
  track: Track;
  index?: number;
  showIndex?: boolean;
  onPlay?: () => void;
}

function formatDuration(seconds?: number) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TrackRow({ track, index, showIndex, onPlay }: TrackRowProps) {
  const actions = usePlayerActions();
  const state = usePlayerState();
  const isActive = state.currentTrack?.id === track.id;

  function handlePlay() {
    if (onPlay) onPlay();
    else actions.playTrack(track);
  }

  return (
    <div
      className={`group flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2.5 md:py-3 rounded-[14px] transition-colors duration-200 ease-out cursor-pointer motion-safe:active:scale-[0.995] motion-reduce:active:scale-100 ${
        isActive
          ? "bg-white/10"
          : "hover:bg-white/[0.06]"
      }`}
      onClick={handlePlay}
    >
      {showIndex && (
        <div className="w-7 h-7 flex items-center justify-center shrink-0">
          {isActive && state.isLoading ? (
            <Loader2
              size={16}
              className="animate-spin text-white/70"
              aria-label="Loading"
            />
          ) : isActive && state.isPlaying ? (
            <span
              className="flex gap-0.5 items-end justify-center h-3.5 w-5"
              aria-label="Playing"
            >
              <span className="w-0.5 rounded-full bg-white/65 h-1 motion-safe:animate-pulse" />
              <span className="w-0.5 rounded-full bg-white/65 h-3 motion-safe:animate-pulse motion-safe:[animation-delay:120ms]" />
              <span className="w-0.5 rounded-full bg-white/65 h-1.5 motion-safe:animate-pulse motion-safe:[animation-delay:240ms]" />
            </span>
          ) : (
            <>
              <span className="text-sm text-white/30 tabular-nums group-hover:hidden">
                {(index ?? 0) + 1}
              </span>
              <Play
                size={14}
                className="text-white hidden group-hover:block mx-auto"
                fill="currentColor"
                aria-hidden
              />
            </>
          )}
        </div>
      )}

      <div className="relative w-10 h-10 md:w-11 md:h-11 shrink-0 rounded-[10px] overflow-hidden">
        <AlbumArt
          src={trackThumbnailUrl(track)}
          alt=""
          fill
          sizes="(max-width: 768px) 40px, 44px"
          className="rounded-[10px]"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm md:text-[15px] font-medium truncate ${
            isActive ? "text-white" : "text-white/90"
          }`}
        >
          {track.title}
        </p>
        <p className="text-xs md:text-[13px] text-white/40 truncate">
          {formatArtists(track)}
          {track.album ? ` \u2022 ${track.album.name}` : ""}
        </p>
      </div>

      <span className="text-xs text-white/30 tabular-nums shrink-0 hidden sm:block">
        {formatDuration(track.duration)}
      </span>

      <button
        className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
        onClick={(e) => {
          e.stopPropagation();
          actions.addToQueue(track);
        }}
        aria-label="Add to queue"
      >
        <Plus size={16} className="text-white/50" />
      </button>
    </div>
  );
}
