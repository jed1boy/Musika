export interface Artist {
  name: string;
  id?: string;
}

export interface Track {
  id: string;
  title: string;
  artists: Artist[];
  album?: { name: string; id?: string };
  duration?: number;
  thumbnail?: string;
  explicit?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artists?: Artist[];
  year?: number;
  thumbnail?: string;
  playlistId?: string;
}

export interface ArtistSummary {
  id: string;
  name: string;
  thumbnail?: string;
}

export interface PlaylistSummary {
  id: string;
  title: string;
  author?: string;
  thumbnail?: string;
  songCount?: string;
}

export type HomeSectionItemType = "tracks" | "albums" | "artists" | "playlists" | "mixed";

export interface HomeSection {
  title: string;
  items: (Track | Album | ArtistSummary | PlaylistSummary)[];
  type: HomeSectionItemType;
}

export interface LyricsLine {
  time: number;
  text: string;
}

export interface StreamInfo {
  url: string;
  mimeType: string;
  bitrate: number;
  expiresAt: number;
}

export interface QueueItem extends Track {
  queueId: string;
}

export type RepeatMode = "off" | "all" | "one";

export interface PlayerState {
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

export interface SearchResults {
  tracks: Track[];
  albums: Album[];
  artists: ArtistSummary[];
  playlists: PlaylistSummary[];
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface AuthStatus {
  connected: boolean;
  name?: string;
  thumbnail?: string;
}

export interface LibraryItem {
  type: "playlist" | "artist" | "album";
  id: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  playlistId?: string;
}
