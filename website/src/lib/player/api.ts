import type {
  ApiResponse,
  SearchResults,
  HomeSection,
  StreamInfo,
  LyricsLine,
  Track,
  AuthStatus,
  LibraryItem,
} from "./types";

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body: ApiResponse<T> = await res.json();
  if (!body.success) throw new Error(body.error.message);
  return body.data;
}

export function searchTracks(query: string) {
  return get<SearchResults>(
    `/api/music/search?q=${encodeURIComponent(query)}`
  );
}

export function getHomeFeed() {
  return get<HomeSection[]>("/api/music/home");
}

export function getStream(videoId: string) {
  return get<StreamInfo>(
    `/api/music/stream?id=${encodeURIComponent(videoId)}`
  );
}

export function getSuggestions(query: string) {
  return get<string[]>(
    `/api/music/suggestions?q=${encodeURIComponent(query)}`
  );
}

export function getQueue(videoId: string, playlistId?: string) {
  const params = new URLSearchParams({ videoId });
  if (playlistId) params.set("playlistId", playlistId);
  return get<Track[]>(`/api/music/queue?${params}`);
}

export function getPlaylistTracks(id: string) {
  return get<Track[]>(`/api/music/playlist?id=${encodeURIComponent(id)}`);
}

// ---------- Auth ----------

export function getAuthStatus() {
  return get<AuthStatus>("/api/auth/yt-status");
}

export function signInUrl() {
  return "/api/auth/google/login";
}

export async function signOut() {
  await fetch("/api/auth/yt-disconnect", { method: "POST" });
}

export function getLibrary(browseId?: string) {
  const params = browseId ? `?browseId=${encodeURIComponent(browseId)}` : "";
  return get<LibraryItem[]>(`/api/music/library${params}`);
}

export function getLikedSongs() {
  return get<Track[]>("/api/music/liked");
}

export function getLyrics(
  title: string,
  artist: string,
  duration?: number
) {
  const params = new URLSearchParams({ title, artist });
  if (duration !== undefined) params.set("duration", String(Math.round(duration)));
  return get<{ raw: string; lines: LyricsLine[] }>(
    `/api/music/lyrics?${params}`
  );
}
