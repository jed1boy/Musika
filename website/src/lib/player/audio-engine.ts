type Listener = () => void;

export class AudioEngine {
  private audio: HTMLAudioElement;
  private listeners = new Set<Listener>();

  constructor() {
    this.audio = new Audio();
    this.audio.preload = "auto";

    const notify = () => this.listeners.forEach((fn) => fn());
    this.audio.addEventListener("timeupdate", notify);
    this.audio.addEventListener("play", notify);
    this.audio.addEventListener("pause", notify);
    this.audio.addEventListener("ended", notify);
    this.audio.addEventListener("loadedmetadata", notify);
    this.audio.addEventListener("waiting", notify);
    this.audio.addEventListener("canplay", notify);
    this.audio.addEventListener("volumechange", notify);
    this.audio.addEventListener("error", notify);
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async load(url: string) {
    this.audio.src = url;
    this.audio.load();
  }

  /** Resolves when play() succeeds; `autoplayBlocked` if the browser rejected autoplay. */
  async play(): Promise<{ autoplayBlocked?: boolean }> {
    try {
      await this.audio.play();
      return {};
    } catch (e) {
      if (e instanceof DOMException && e.name === "NotAllowedError") {
        return { autoplayBlocked: true };
      }
      return {};
    }
  }

  /** One-shot listener for media element error (decode/network). */
  addErrorListenerOnce(fn: () => void) {
    const wrapped = () => {
      fn();
    };
    this.audio.addEventListener("error", wrapped, { once: true });
    return () => this.audio.removeEventListener("error", wrapped);
  }

  pause() {
    this.audio.pause();
  }

  seek(time: number) {
    if (Number.isFinite(time)) this.audio.currentTime = time;
  }

  setVolume(v: number) {
    this.audio.volume = Math.max(0, Math.min(1, v));
  }

  setMuted(m: boolean) {
    this.audio.muted = m;
  }

  get currentTime() {
    return this.audio.currentTime;
  }

  get duration() {
    return Number.isFinite(this.audio.duration) ? this.audio.duration : 0;
  }

  get paused() {
    return this.audio.paused;
  }

  get volume() {
    return this.audio.volume;
  }

  get muted() {
    return this.audio.muted;
  }

  get waiting() {
    return this.audio.readyState < 3 && !this.audio.paused;
  }

  get ended() {
    return this.audio.ended;
  }

  get error() {
    return this.audio.error;
  }

  onEnded(fn: () => void) {
    this.audio.addEventListener("ended", fn);
    return () => this.audio.removeEventListener("ended", fn);
  }

  updateMediaSession(track: { title: string; artist: string; artwork?: string }) {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      ...(track.artwork && {
        artwork: [{ src: track.artwork, sizes: "512x512", type: "image/jpeg" }],
      }),
    });
  }

  setMediaSessionHandlers(handlers: {
    play?: () => void;
    pause?: () => void;
    previoustrack?: () => void;
    nexttrack?: () => void;
    seekto?: (details: { seekTime?: number }) => void;
  }) {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    if (handlers.play) ms.setActionHandler("play", handlers.play);
    if (handlers.pause) ms.setActionHandler("pause", handlers.pause);
    if (handlers.previoustrack) ms.setActionHandler("previoustrack", handlers.previoustrack);
    if (handlers.nexttrack) ms.setActionHandler("nexttrack", handlers.nexttrack);
    if (handlers.seekto)
      ms.setActionHandler("seekto", (d) => handlers.seekto?.(d));
  }

  destroy() {
    this.audio.pause();
    this.audio.src = "";
    this.listeners.clear();
  }
}
