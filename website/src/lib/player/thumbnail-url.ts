/** Normalize API thumbnail URLs for Next/Image and the browser (https, trim). */
export function normalizeThumbnailUrl(
  url: string | undefined | null
): string | undefined {
  if (url == null || typeof url !== "string") return undefined;
  const t = url.trim();
  if (!t) return undefined;
  if (t.startsWith("//")) return `https:${t}`;
  if (t.startsWith("http://")) return `https://${t.slice(7)}`;
  return t;
}

const YT_VIDEO_ID = /^[\w-]{11}$/;

/**
 * Prefer API thumbnail; fall back to YouTube poster when `id` is a watch `videoId`
 * (InnerTube sometimes omits or returns blocked thumb URLs).
 */
export function trackThumbnailUrl(track: {
  id: string;
  thumbnail?: string | null;
}): string | undefined {
  const fromApi = normalizeThumbnailUrl(track.thumbnail);
  if (fromApi) return fromApi;
  if (track.id && YT_VIDEO_ID.test(track.id)) {
    return `https://i.ytimg.com/vi/${track.id}/mqdefault.jpg`;
  }
  return undefined;
}
