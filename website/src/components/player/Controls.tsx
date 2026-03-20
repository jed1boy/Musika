"use client";

import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import { usePlayerActions, usePlayerState } from "./PlayerProvider";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlaybackControls() {
  const state = usePlayerState();
  const actions = usePlayerActions();

  return (
    <div className="flex items-center gap-3 md:gap-4">
      <button
        onClick={actions.toggleShuffle}
        className={`p-1.5 rounded-full transition-colors duration-150 ease-out motion-reduce:transition-none ${
          state.shuffle ? "text-white" : "text-white/30 hover:text-white/60"
        }`}
        aria-label="Shuffle"
      >
        <Shuffle size={16} />
      </button>

      <button
        onClick={actions.prev}
        className="p-1.5 text-white/70 hover:text-white transition-colors duration-150 ease-out motion-reduce:transition-none"
        aria-label="Previous"
      >
        <SkipBack size={20} fill="currentColor" />
      </button>

      <button
        onClick={actions.togglePlay}
        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-150 ease-out motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
        aria-label={state.isPlaying ? "Pause" : "Play"}
      >
        {state.isLoading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : state.isPlaying ? (
          <Pause size={20} fill="currentColor" />
        ) : (
          <Play size={20} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <button
        onClick={actions.next}
        className="p-1.5 text-white/70 hover:text-white transition-colors duration-150 ease-out motion-reduce:transition-none"
        aria-label="Next"
      >
        <SkipForward size={20} fill="currentColor" />
      </button>

      <button
        onClick={actions.cycleRepeat}
        className={`p-1.5 rounded-full transition-colors duration-150 ease-out motion-reduce:transition-none ${
          state.repeat !== "off" ? "text-white" : "text-white/30 hover:text-white/60"
        }`}
        aria-label="Repeat"
      >
        {state.repeat === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
      </button>
    </div>
  );
}

export function SeekBar({
  variant = "default",
}: {
  /** `chrome`: full-width bar row for bottom player (YTM-style). */
  variant?: "default" | "chrome";
}) {
  const state = usePlayerState();
  const actions = usePlayerActions();
  const progress = state.duration > 0 ? state.currentTime / state.duration : 0;

  const trackHit = variant === "chrome" ? "h-4" : "h-5";
  const trackH = variant === "chrome" ? "h-1" : "h-1";

  return (
    <div
      className={`flex items-center w-full ${
        variant === "chrome" ? "gap-3" : "gap-2 md:gap-3"
      }`}
    >
      <span
        className={`text-[11px] tabular-nums text-right shrink-0 font-variant-numeric ${
          variant === "chrome"
            ? "text-white/45 w-10"
            : "text-white/40 w-9"
        }`}
      >
        {formatTime(state.currentTime)}
      </span>
      <div
        className={`flex-1 group relative ${trackHit} flex items-center cursor-pointer`}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          actions.seek(ratio * state.duration);
        }}
      >
        <div
          className={`w-full ${trackH} bg-white/[0.12] rounded-full overflow-hidden group-hover:bg-white/[0.16] transition-colors duration-150 ease-out`}
        >
          <div
            className="h-full bg-white rounded-full transition-[width] duration-100 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div
          className="absolute w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out shadow-md top-1/2 -translate-y-1/2"
          style={{ left: `calc(${progress * 100}% - 6px)` }}
        />
      </div>
      <span
        className={`text-[11px] tabular-nums shrink-0 font-variant-numeric ${
          variant === "chrome" ? "text-white/45 w-10" : "text-white/40 w-9"
        }`}
      >
        {formatTime(state.duration)}
      </span>
    </div>
  );
}

export function VolumeControl() {
  const state = usePlayerState();
  const actions = usePlayerActions();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={actions.toggleMute}
        className="p-1 text-white/50 hover:text-white/80 transition-colors"
        aria-label={state.isMuted ? "Unmute" : "Mute"}
      >
        {state.isMuted || state.volume === 0 ? (
          <VolumeX size={18} />
        ) : (
          <Volume2 size={18} />
        )}
      </button>
      <div
        className="w-20 group relative h-4 flex items-center cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          actions.setVolume(ratio);
        }}
      >
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/50 rounded-full"
            style={{ width: `${(state.isMuted ? 0 : state.volume) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
