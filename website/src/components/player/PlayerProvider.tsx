"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AudioEngine } from "@/lib/player/audio-engine";
import { formatArtists } from "@/lib/player/format-artists";
import { trackThumbnailUrl } from "@/lib/player/thumbnail-url";
import { loadState, saveState } from "@/lib/player/persistence";
import type { Artist, Track, QueueItem, RepeatMode } from "@/lib/player/types";

function makeQueueItem(track: Track): QueueItem {
  const artists = Array.isArray(track.artists) ? track.artists : [];
  return {
    ...track,
    artists,
    queueId: `${track.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
}

function sanitizeQueueItem(x: unknown): QueueItem | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== "string" || o.id.length === 0) return null;
  const artists: Artist[] = Array.isArray(o.artists)
    ? (o.artists as unknown[]).reduce<Artist[]>((acc, a) => {
        if (a && typeof a === "object" && typeof (a as { name?: unknown }).name === "string") {
          const id = (a as { id?: unknown }).id;
          acc.push({
            name: (a as { name: string }).name,
            ...(typeof id === "string" ? { id } : {}),
          });
        }
        return acc;
      }, [])
    : [];
  const queueId =
    typeof o.queueId === "string" && o.queueId.length > 0
      ? o.queueId
      : `${o.id}-${Date.now()}-fix`;
  return {
    id: o.id,
    title: typeof o.title === "string" ? o.title : "",
    artists,
    album:
      o.album && typeof o.album === "object" && typeof (o.album as { name?: unknown }).name === "string"
        ? {
            name: (o.album as { name: string }).name,
            ...(typeof (o.album as { id?: unknown }).id === "string"
              ? { id: (o.album as { id: string }).id }
              : {}),
          }
        : undefined,
    duration: typeof o.duration === "number" ? o.duration : undefined,
    thumbnail: typeof o.thumbnail === "string" ? o.thumbnail : undefined,
    explicit: typeof o.explicit === "boolean" ? o.explicit : undefined,
    queueId,
  };
}

export interface PlayerActions {
  playTrack: (track: Track) => void;
  playTracks: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (queueId: string) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  clearPlaybackError: () => void;
}

export interface PlayerSnapshot {
  currentTrack: QueueItem | null;
  queue: QueueItem[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  isLoading: boolean;
  playbackError: string | null;
}

const PlayerActionsCtx = createContext<PlayerActions | null>(null);
const PlayerStateCtx = createContext<() => PlayerSnapshot>(() => ({
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  shuffle: false,
  repeat: "off",
  isLoading: false,
  playbackError: null,
}));
const PlayerSubscribeCtx = createContext<(fn: () => void) => () => void>(
  () => () => {}
);

export function usePlayerActions() {
  const ctx = useContext(PlayerActionsCtx);
  if (!ctx) throw new Error("usePlayerActions requires PlayerProvider");
  return ctx;
}

export function usePlayerState(): PlayerSnapshot {
  const subscribe = useContext(PlayerSubscribeCtx);
  const getSnapshot = useContext(PlayerStateCtx);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Latest snapshot ref updated on every player tick, without re-rendering the caller (for global shortcuts, etc.). */
export function usePlayerStateRef() {
  const subscribe = useContext(PlayerSubscribeCtx);
  const getSnapshot = useContext(PlayerStateCtx);
  const ref = useRef<PlayerSnapshot>(getSnapshot());
  useEffect(() => {
    ref.current = getSnapshot();
    return subscribe(() => {
      ref.current = getSnapshot();
    });
  }, [subscribe, getSnapshot]);
  return ref;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef<AudioEngine | null>(null);
  const stateRef = useRef<PlayerSnapshot>({
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    shuffle: false,
    repeat: "off",
    isLoading: false,
    playbackError: null,
  });
  const listenersRef = useRef(new Set<() => void>());
  const loadingRef = useRef(false);

  const notify = useCallback(() => {
    listenersRef.current.forEach((fn) => fn());
  }, []);

  const subscribe = useCallback((fn: () => void) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  const getSnapshot = useCallback(() => stateRef.current, []);

  const update = useCallback(
    (partial: Partial<PlayerSnapshot>) => {
      stateRef.current = { ...stateRef.current, ...partial };
      notify();
    },
    [notify]
  );

  const persist = useCallback(() => {
    const s = stateRef.current;
    saveState({
      queue: s.queue,
      queueIndex: s.queueIndex,
      volume: s.volume,
      shuffle: s.shuffle,
      repeat: s.repeat,
      currentTime: s.currentTime,
    });
  }, []);

  useEffect(() => {
    const engine = new AudioEngine();
    engineRef.current = engine;

    const saved = loadState();
    const initialVolume = saved.volume ?? 0.8;
    engine.setVolume(initialVolume);

    if (saved.queue && saved.queue.length > 0) {
      const sanitized = saved.queue
        .map(sanitizeQueueItem)
        .filter((q): q is QueueItem => q !== null);
      if (sanitized.length > 0) {
        const idx = Math.min(saved.queueIndex ?? 0, sanitized.length - 1);
        update({
          queue: sanitized,
          queueIndex: idx,
          currentTrack: sanitized[idx] ?? null,
          volume: initialVolume,
          shuffle: saved.shuffle ?? false,
          repeat: saved.repeat ?? "off",
        });
      } else {
        update({ volume: initialVolume });
      }
    } else {
      update({ volume: initialVolume });
    }

    const unsub = engine.subscribe(() => {
      update({
        isPlaying: !engine.paused,
        currentTime: engine.currentTime,
        duration: engine.duration,
        volume: engine.volume,
        isMuted: engine.muted,
        isLoading: engine.waiting || loadingRef.current,
      });
    });

    const unEnded = engine.onEnded(() => {
      const s = stateRef.current;
      if (s.repeat === "one") {
        engine.seek(0);
        engine.play();
        return;
      }
      const nextIdx = s.queueIndex + 1;
      if (nextIdx < s.queue.length) {
        const nextTrack = s.queue[nextIdx];
        update({ queueIndex: nextIdx, currentTrack: nextTrack });
        loadAndPlay(nextTrack);
      } else if (s.repeat === "all" && s.queue.length > 0) {
        const first = s.queue[0];
        update({ queueIndex: 0, currentTrack: first });
        loadAndPlay(first);
      } else {
        update({ isPlaying: false });
      }
    });

    engine.setMediaSessionHandlers({
      play: () => engine.play(),
      pause: () => engine.pause(),
      nexttrack: () => actions.next(),
      previoustrack: () => actions.prev(),
      seekto: (d) => {
        if (d.seekTime !== undefined) engine.seek(d.seekTime);
      },
    });

    const saveInterval = setInterval(persist, 5000);

    return () => {
      unsub();
      unEnded();
      clearInterval(saveInterval);
      engine.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAndPlay(track: QueueItem) {
    const engine = engineRef.current;
    if (!engine) return;
    loadingRef.current = true;
    update({ isLoading: true, playbackError: null });
    const trackIdAtLoad = track.id;
    const removeErr = engine.addErrorListenerOnce(() => {
      if (stateRef.current.currentTrack?.id !== trackIdAtLoad) return;
      loadingRef.current = false;
      update({
        isLoading: false,
        playbackError: "Could not play this track",
      });
    });
    try {
      const proxyUrl = `/api/music/play?id=${encodeURIComponent(track.id)}`;
      await engine.load(proxyUrl);
      const { autoplayBlocked } = await engine.play();
      if (autoplayBlocked) {
        update({
          playbackError: "Tap play to start audio",
        });
      }
      const art = trackThumbnailUrl(track);
      engine.updateMediaSession({
        title: track.title,
        artist: formatArtists(track),
        artwork: art,
      });
    } catch (err) {
      console.error("Playback failed:", err);
      const msg = err instanceof Error ? err.message : "Playback failed";
      update({ playbackError: msg });
    } finally {
      removeErr();
      loadingRef.current = false;
      update({ isLoading: false });
    }
  }

  const actions: PlayerActions = {
    playTrack(track) {
      const item = makeQueueItem(track);
      update({ queue: [item], queueIndex: 0, currentTrack: item });
      loadAndPlay(item);
    },
    playTracks(tracks, startIndex = 0) {
      const items = tracks.map(makeQueueItem);
      update({
        queue: items,
        queueIndex: startIndex,
        currentTrack: items[startIndex] ?? null,
      });
      if (items[startIndex]) loadAndPlay(items[startIndex]);
    },
    addToQueue(track) {
      const item = makeQueueItem(track);
      const q = [...stateRef.current.queue, item];
      update({ queue: q });
      if (!stateRef.current.currentTrack) {
        update({ queueIndex: q.length - 1, currentTrack: item });
        loadAndPlay(item);
      }
    },
    removeFromQueue(queueId) {
      const s = stateRef.current;
      const idx = s.queue.findIndex((q) => q.queueId === queueId);
      if (idx === -1) return;
      const q = s.queue.filter((_, i) => i !== idx);
      let newIdx = s.queueIndex;
      if (idx < s.queueIndex) newIdx--;
      else if (idx === s.queueIndex) {
        if (q[newIdx]) {
          update({ queue: q, currentTrack: q[newIdx] });
          loadAndPlay(q[newIdx]);
          return;
        }
        newIdx = Math.max(0, q.length - 1);
      }
      update({
        queue: q,
        queueIndex: newIdx,
        currentTrack: q[newIdx] ?? null,
      });
    },
    togglePlay() {
      const engine = engineRef.current;
      if (!engine) return;
      if (engine.paused) {
        if (!engine.duration && stateRef.current.currentTrack) {
          loadAndPlay(stateRef.current.currentTrack);
        } else {
          void engine.play().then(({ autoplayBlocked }) => {
            if (!autoplayBlocked) {
              update({ playbackError: null });
            }
          });
        }
      } else {
        engine.pause();
      }
    },
    clearPlaybackError() {
      update({ playbackError: null });
    },
    next() {
      const s = stateRef.current;
      if (s.shuffle) {
        const idx = Math.floor(Math.random() * s.queue.length);
        update({ queueIndex: idx, currentTrack: s.queue[idx] });
        if (s.queue[idx]) loadAndPlay(s.queue[idx]);
        return;
      }
      const nextIdx = s.queueIndex + 1;
      if (nextIdx < s.queue.length) {
        update({ queueIndex: nextIdx, currentTrack: s.queue[nextIdx] });
        loadAndPlay(s.queue[nextIdx]);
      } else if (s.repeat === "all" && s.queue.length > 0) {
        update({ queueIndex: 0, currentTrack: s.queue[0] });
        loadAndPlay(s.queue[0]);
      }
    },
    prev() {
      const engine = engineRef.current;
      if (!engine) return;
      if (engine.currentTime > 3) {
        engine.seek(0);
        return;
      }
      const s = stateRef.current;
      const prevIdx = s.queueIndex - 1;
      if (prevIdx >= 0) {
        update({ queueIndex: prevIdx, currentTrack: s.queue[prevIdx] });
        loadAndPlay(s.queue[prevIdx]);
      } else {
        engine.seek(0);
      }
    },
    seek(time) {
      engineRef.current?.seek(time);
    },
    setVolume(v) {
      engineRef.current?.setVolume(v);
    },
    toggleMute() {
      const engine = engineRef.current;
      if (engine) engine.setMuted(!engine.muted);
    },
    toggleShuffle() {
      update({ shuffle: !stateRef.current.shuffle });
    },
    cycleRepeat() {
      const modes: RepeatMode[] = ["off", "all", "one"];
      const cur = modes.indexOf(stateRef.current.repeat);
      update({ repeat: modes[(cur + 1) % modes.length] });
    },
  };

  return (
    <PlayerActionsCtx.Provider value={actions}>
      <PlayerSubscribeCtx.Provider value={subscribe}>
        <PlayerStateCtx.Provider value={getSnapshot}>
          {children}
        </PlayerStateCtx.Provider>
      </PlayerSubscribeCtx.Provider>
    </PlayerActionsCtx.Provider>
  );
}
