import type { LyricsLine } from "@/lib/player/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const LRCLIB_BASE = "https://lrclib.net";
const KUGOU_SEARCH = "https://lyrics.kugou.com/search";
const KUGOU_DOWNLOAD = "https://lyrics.kugou.com/download";
const UA = "Musika (https://github.com/jed1boy/Musika)";

const LINE_RE = /((\[\d\d:\d\d\.\d{2,3}\] ?)+)(.+)/;
const TIME_RE = /\[(\d\d):(\d\d)\.(\d{2,3})\]/g;

export function parseLrc(raw: string): LyricsLine[] {
  return raw
    .split("\n")
    .flatMap((line) => {
      const m = line.trim().match(LINE_RE);
      if (!m) return [];
      const text = m[3];
      const times = [...m[1].matchAll(TIME_RE)];
      return times.map((t) => {
        const min = Number(t[1]);
        const sec = Number(t[2]);
        let ms = Number(t[3]);
        if (t[3].length === 2) ms *= 10;
        return { time: min * 60_000 + sec * 1000 + ms, text };
      });
    })
    .sort((a, b) => a.time - b.time);
}

async function lrcLibSearch(
  artist: string,
  title: string,
  duration?: number
): Promise<string | null> {
  try {
    if (duration !== undefined) {
      const params = new URLSearchParams({
        artist_name: artist,
        track_name: title,
        duration: String(Math.round(duration)),
      });
      const res = await fetch(`${LRCLIB_BASE}/api/get?${params}`, {
        headers: { "User-Agent": UA },
      });
      if (res.ok) {
        const dto = await res.json();
        if (dto.syncedLyrics) return dto.syncedLyrics;
        if (dto.plainLyrics) return dto.plainLyrics;
      }
    }

    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist,
    });
    const res = await fetch(`${LRCLIB_BASE}/api/search?${params}`, {
      headers: { "User-Agent": UA },
    });
    if (!res.ok) return null;
    const tracks: any[] = await res.json();
    const synced = tracks.find((t: any) => t.syncedLyrics);
    if (synced) return synced.syncedLyrics;
    const plain = tracks.find((t: any) => t.plainLyrics);
    return plain?.plainLyrics ?? null;
  } catch {
    return null;
  }
}

function normalizeTitle(title: string): string {
  return title
    .replace(/\(.*?\)/g, "")
    .replace(/（.*?）/g, "")
    .replace(/「.*?」/g, "")
    .replace(/『.*?』/g, "")
    .replace(/<.*?>/g, "")
    .replace(/《.*?》/g, "")
    .trim();
}

function normalizeArtist(artist: string): string {
  return artist
    .replace(/, /g, "、")
    .replace(/ & /g, "、")
    .replace(/\./g, "")
    .replace(/和/g, "、")
    .replace(/\(.*?\)/g, "")
    .replace(/（.*?）/g, "")
    .trim();
}

async function kugouSearch(
  artist: string,
  title: string,
  duration?: number
): Promise<string | null> {
  try {
    const keyword = `${normalizeTitle(title)} - ${normalizeArtist(artist)}`;
    const searchParams = new URLSearchParams({
      ver: "1",
      man: "yes",
      client: "pc",
      keyword,
    });
    if (duration !== undefined && duration > 0) {
      searchParams.set("duration", String(Math.round(duration * 1000)));
    }
    const searchRes = await fetch(`${KUGOU_SEARCH}?${searchParams}`, {
      headers: { "User-Agent": UA },
    });
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const candidate = searchData?.candidates?.[0];
    if (!candidate) return null;

    const dlParams = new URLSearchParams({
      fmt: "lrc",
      charset: "utf8",
      client: "pc",
      ver: "1",
      id: String(candidate.id),
      accesskey: candidate.accesskey,
    });
    const dlRes = await fetch(`${KUGOU_DOWNLOAD}?${dlParams}`, {
      headers: { "User-Agent": UA },
    });
    if (!dlRes.ok) return null;
    const { content } = await dlRes.json();
    return Buffer.from(content, "base64").toString("utf8").replace(/&apos;/g, "'");
  } catch {
    return null;
  }
}

export async function getLyrics(
  title: string,
  artist: string,
  duration?: number
): Promise<{ raw: string; lines: LyricsLine[] } | null> {
  const [lrcLib, kugou] = await Promise.allSettled([
    lrcLibSearch(artist, title, duration),
    kugouSearch(artist, title, duration),
  ]);

  const raw =
    (lrcLib.status === "fulfilled" ? lrcLib.value : null) ??
    (kugou.status === "fulfilled" ? kugou.value : null);

  if (!raw) return null;

  const lines = parseLrc(raw);
  return { raw, lines: lines.length > 0 ? lines : [] };
}
