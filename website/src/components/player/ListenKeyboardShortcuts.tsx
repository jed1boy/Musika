"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  usePlayerActions,
  usePlayerStateRef,
  type PlayerActions,
  type PlayerSnapshot,
} from "./PlayerProvider";

const SEEK_SEC = 5;
const VOL_STEP = 0.08;

function shouldIgnoreShortcuts(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  if (target.closest("[data-no-player-shortcuts]")) return true;
  return Boolean(
    target.closest(
      "button, a[href], [role='button'], [role='link'], [role='menuitem'], [role='tab'], [role='option'], [role='slider']"
    )
  );
}

function handleKey(
  e: KeyboardEvent,
  state: PlayerSnapshot,
  actions: PlayerActions,
  helpOpenRef: { current: boolean },
  setHelpOpen: (v: boolean | ((b: boolean) => boolean)) => void
): void {
  if (e.repeat) return;

  const target = e.target;
  const helpOpen = helpOpenRef.current;

  if (shouldIgnoreShortcuts(target)) {
    if (e.key === "Escape" && helpOpen) {
      e.preventDefault();
      setHelpOpen(false);
    }
    return;
  }

  const s = state;
  const a = actions;
  const hasTrack = Boolean(s.currentTrack);

  switch (e.code) {
    case "MediaPlayPause":
      if (!hasTrack) return;
      e.preventDefault();
      a.togglePlay();
      return;
    case "MediaTrackNext":
      if (!hasTrack) return;
      e.preventDefault();
      a.next();
      return;
    case "MediaTrackPrevious":
      if (!hasTrack) return;
      e.preventDefault();
      a.prev();
      return;
  }

  if (e.key === "Escape" && helpOpen) {
    e.preventDefault();
    setHelpOpen(false);
    return;
  }

  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const letter = e.key.length === 1 ? e.key.toLowerCase() : "";

  if (e.key === "?" || letter === "h") {
    e.preventDefault();
    setHelpOpen((o) => !o);
    return;
  }

  if (e.key === " " || letter === "k") {
    if (!hasTrack) return;
    e.preventDefault();
    a.togglePlay();
    return;
  }

  if (letter === "m") {
    e.preventDefault();
    a.toggleMute();
    return;
  }

  if (letter === "s" && hasTrack) {
    e.preventDefault();
    a.toggleShuffle();
    return;
  }

  if (letter === "r" && hasTrack) {
    e.preventDefault();
    a.cycleRepeat();
    return;
  }

  switch (e.key) {
    case "ArrowLeft": {
      if (!hasTrack) return;
      e.preventDefault();
      if (e.shiftKey) a.prev();
      else a.seek(Math.max(0, s.currentTime - SEEK_SEC));
      return;
    }
    case "ArrowRight": {
      if (!hasTrack) return;
      e.preventDefault();
      if (e.shiftKey) a.next();
      else {
        const dur = s.duration;
        const t = s.currentTime + SEEK_SEC;
        a.seek(dur > 0 ? Math.min(dur, t) : t);
      }
      return;
    }
    case "ArrowUp": {
      e.preventDefault();
      if (s.isMuted) a.toggleMute();
      a.setVolume(Math.min(1, s.volume + VOL_STEP));
      return;
    }
    case "ArrowDown": {
      e.preventDefault();
      a.setVolume(Math.max(0, s.volume - VOL_STEP));
      return;
    }
    default:
      return;
  }
}

export function ListenKeyboardShortcuts() {
  const stateRef = usePlayerStateRef();
  const actions = usePlayerActions();
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const [helpOpen, setHelpOpen] = useState(false);
  const helpOpenRef = useRef(helpOpen);
  helpOpenRef.current = helpOpen;

  const setHelpOpenStable = useCallback(
    (v: boolean | ((b: boolean) => boolean)) => setHelpOpen(v),
    []
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      handleKey(
        e,
        stateRef.current,
        actionsRef.current,
        helpOpenRef,
        setHelpOpenStable
      );
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stateRef, setHelpOpenStable]);

  if (!helpOpen) return null;

  const rows: [string, string][] = [
    ["Space / K", "Play / pause"],
    ["← / →", "Seek ±5s"],
    ["Shift ← / Shift →", "Previous / next track"],
    ["↑ / ↓", "Volume up / down"],
    ["M", "Mute"],
    ["S", "Shuffle"],
    ["R", "Repeat (off → all → one)"],
    ["Media keys", "Play/pause, next, previous"],
    ["H or ?", "Toggle this panel"],
    ["Esc", "Close this panel"],
  ];

  return (
    <div
      data-no-player-shortcuts
      className="fixed bottom-24 right-4 md:right-8 z-[60] max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl p-4 shadow-2xl text-sm text-white/80"
      role="dialog"
      aria-label="Keyboard shortcuts"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40 mb-3">
        Shortcuts
      </p>
      <ul className="space-y-2.5">
        {rows.map(([keys, desc]) => (
          <li key={keys} className="flex justify-between gap-4">
            <kbd className="shrink-0 font-mono text-[11px] text-white/55 bg-white/[0.08] px-2 py-0.5 rounded-md">
              {keys}
            </kbd>
            <span className="text-right text-white/70 leading-snug">{desc}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
