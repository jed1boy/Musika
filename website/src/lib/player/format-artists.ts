import type { Artist, Track } from "./types";

/** Safe display string for track artists (persisted/API data may omit or corrupt `artists`). */
export function formatArtists(
  track: Pick<Track, "artists"> | { artists?: Artist[] | undefined }
): string {
  const list = track.artists;
  if (!Array.isArray(list) || list.length === 0) return "";
  return list
    .map((a) => (a && typeof a.name === "string" ? a.name : ""))
    .filter(Boolean)
    .join(", ");
}
