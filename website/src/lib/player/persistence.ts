import type { QueueItem, RepeatMode } from "./types";

const KEY = "musika_player_v1";

interface PersistedState {
  queue: QueueItem[];
  queueIndex: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  currentTime: number;
}

export function loadState(): Partial<PersistedState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveState(state: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded — silently ignore */
  }
}
