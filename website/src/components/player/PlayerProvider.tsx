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
import { loadState, saveState } from "@/lib/player/persistence";
import type { Track, QueueItem, RepeatMode } from "@/lib/player/types";

function makeQueueItem(track: Track): QueueItem {
  return { ...track, queueId: `${track.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
}

interface PlayerActions {
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
}

interface PlayerSnapshot {
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
      const idx = saved.queueIndex ?? 0;
      update({
        queue: saved.queue,
        queueIndex: idx,
        currentTrack: saved.queue[idx] ?? null,
        volume: initialVolume,
        shuffle: saved.shuffle ?? false,
        repeat: saved.repeat ?? "off",
      });
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
    update({ isLoading: true });
    try {
      const proxyUrl = `/api/music/play?id=${encodeURIComponent(track.id)}`;
      await engine.load(proxyUrl);
      await engine.play();
      engine.updateMediaSession({
        title: track.title,
        artist: track.artists.map((a) => a.name).join(", "),
        artwork: track.thumbnail,
      });
    } catch (err) {
      console.error("Playback failed:", err);
    } finally {
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
          engine.play();
        }
      } else {
        engine.pause();
      }
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
