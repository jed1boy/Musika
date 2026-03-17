"use client";

import Image from "next/image";
import { Play, Plus, Loader2 } from "lucide-react";
import type { Track } from "@/lib/player/types";
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
      className={`group flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2.5 md:py-3 rounded-[14px] transition-colors duration-200 cursor-pointer ${
        isActive
          ? "bg-white/10"
          : "hover:bg-white/[0.06]"
      }`}
      onClick={handlePlay}
    >
      {showIndex && (
        <div className="w-7 text-center shrink-0">
          {isActive && state.isPlaying ? (
            <Loader2 size={16} className="animate-spin text-white/70 mx-auto" />
          ) : (
            <span className="text-sm text-white/30 tabular-nums group-hover:hidden">
              {(index ?? 0) + 1}
            </span>
          )}
          <Play
            size={14}
            className="text-white hidden group-hover:block mx-auto"
            fill="currentColor"
          />
        </div>
      )}

      {track.thumbnail && (
        <Image
          src={track.thumbnail}
          alt=""
          width={44}
          height={44}
          unoptimized
          className="w-10 h-10 md:w-11 md:h-11 rounded-[10px] object-cover shrink-0 bg-white/5"
        />
      )}

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm md:text-[15px] font-medium truncate ${
            isActive ? "text-white" : "text-white/90"
          }`}
        >
          {track.title}
        </p>
        <p className="text-xs md:text-[13px] text-white/40 truncate">
          {track.artists.map((a) => a.name).join(", ")}
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
