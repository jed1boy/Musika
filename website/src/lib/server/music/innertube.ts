/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Track, Album, ArtistSummary, PlaylistSummary, HomeSection, StreamInfo } from "@/lib/player/types";

const API_BASE = "https://music.youtube.com/youtubei/v1";
const ORIGIN = "https://music.youtube.com";
const REFERER = "https://music.youtube.com/";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0";

// ---------- Auth types ----------

export interface AuthCredentials {
  accessToken: string;
}

interface ClientConfig {
  clientName: string;
  clientVersion: string;
  clientId: string;
  userAgent: string;
  osName?: string;
  osVersion?: string;
  platform?: string;
  deviceMake?: string;
  deviceModel?: string;
  androidSdkVersion?: string;
  useSignatureTimestamp?: boolean;
}

const WEB_REMIX: ClientConfig = {
  clientName: "WEB_REMIX",
  clientVersion: "1.20250310.01.00",
  clientId: "67",
  userAgent: USER_AGENT,
  useSignatureTimestamp: true,
};

const TVHTML5_EMBED: ClientConfig = {
  clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
  clientVersion: "2.0",
  clientId: "85",
  userAgent:
    "Mozilla/5.0 (PlayStation; PlayStation 4/12.02) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15",
  useSignatureTimestamp: true,
};

const ANDROID_VR: ClientConfig = {
  clientName: "ANDROID_VR",
  clientVersion: "1.43.32",
  clientId: "28",
  userAgent:
    "com.google.android.apps.youtube.vr.oculus/1.43.32 (Linux; U; Android 12; en_US; Quest 3; Build/SQ3A.220605.009.A1; Cronet/107.0.5284.2)",
  osName: "Android",
  osVersion: "12",
  platform: "MOBILE",
  deviceMake: "Oculus",
  deviceModel: "Quest 3",
  androidSdkVersion: "32",
};

const ANDROID_VR_NEW: ClientConfig = {
  clientName: "ANDROID_VR",
  clientVersion: "1.61.48",
  clientId: "28",
  userAgent:
    "com.google.android.apps.youtube.vr.oculus/1.61.48 (Linux; U; Android 12; en_US; Quest 3; Build/SQ3A.220605.009.A1; Cronet/132.0.6808.3)",
  osName: "Android",
  osVersion: "12",
  platform: "MOBILE",
  deviceMake: "Oculus",
  deviceModel: "Quest 3",
  androidSdkVersion: "32",
};

const ANDROID_CREATOR: ClientConfig = {
  clientName: "ANDROID_CREATOR",
  clientVersion: "23.47.101",
  clientId: "14",
  userAgent:
    "com.google.android.apps.youtube.creator/23.47.101 (Linux; U; Android 15; en_US; Pixel 9 Pro Fold; Build/AP3A.241005.015.A2; Cronet/132.0.6779.0)",
  osName: "Android",
  osVersion: "15",
  platform: "MOBILE",
  deviceMake: "Google",
  deviceModel: "Pixel 9 Pro Fold",
  androidSdkVersion: "35",
  useSignatureTimestamp: true,
};

const IPADOS: ClientConfig = {
  clientName: "IOS",
  clientVersion: "19.22.3",
  clientId: "5",
  userAgent:
    "com.google.ios.youtube/19.22.3 (iPad7,6; U; CPU iPadOS 17_7_10 like Mac OS X; en-US)",
  osName: "iPadOS",
  osVersion: "17.7.10.21H450",
  deviceMake: "Apple",
  deviceModel: "iPad7,6",
};

const IOS: ClientConfig = {
  clientName: "IOS",
  clientVersion: "20.10.4",
  clientId: "5",
  userAgent:
    "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)",
  osName: "iOS",
  osVersion: "18.3.2.22D82",
};

// ---------- Visitor data (session token) ----------

let cachedVisitorData: { value: string; fetchedAt: number } | null = null;

async function getVisitorData(): Promise<string | undefined> {
  if (cachedVisitorData && Date.now() - cachedVisitorData.fetchedAt < 3_600_000) {
    return cachedVisitorData.value;
  }
  try {
    const res = await fetch("https://music.youtube.com/sw.js_data", {
      headers: { "User-Agent": USER_AGENT, Referer: REFERER },
    });
    if (!res.ok) return undefined;
    const text = await res.text();
    const json = JSON.parse(text.substring(5));
    const candidates: string[] = json?.[0]?.[2] ?? [];
    const vd = candidates.find(
      (v: any) => typeof v === "string" && /^Cg[ts]/.test(v)
    );
    if (vd) {
      cachedVisitorData = { value: vd, fetchedAt: Date.now() };
      return vd;
    }
  } catch (e) {
    console.error("[innertube] visitor data fetch failed:", e);
  }
  return undefined;
}

// ---------- Context / headers / HTTP ----------

function buildContext(client: ClientConfig, visitorData?: string) {
  return {
    client: {
      clientName: client.clientName,
      clientVersion: client.clientVersion,
      hl: "en",
      gl: "US",
      ...(client.osName && { osName: client.osName }),
      ...(client.osVersion && { osVersion: client.osVersion }),
      ...(client.platform && { platform: client.platform }),
      ...(client.deviceMake && { deviceMake: client.deviceMake }),
      ...(client.deviceModel && { deviceModel: client.deviceModel }),
      ...(client.androidSdkVersion && { androidSdkVersion: client.androidSdkVersion }),
      ...(visitorData && { visitorData }),
    },
  };
}

function buildHeaders(client: ClientConfig, auth?: AuthCredentials): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Goog-Api-Format-Version": "1",
    "X-YouTube-Client-Name": client.clientId,
    "X-YouTube-Client-Version": client.clientVersion,
    "X-Origin": ORIGIN,
    Referer: REFERER,
    "User-Agent": client.userAgent,
    Origin: ORIGIN,
  };
  if (auth) {
    headers["Authorization"] = `Bearer ${auth.accessToken}`;
  }
  return headers;
}

interface PostOptions {
  visitorData?: string;
  auth?: AuthCredentials;
}

async function post(endpoint: string, body: object, client: ClientConfig, visitorDataOrOpts?: string | PostOptions) {
  const opts: PostOptions = typeof visitorDataOrOpts === "string"
    ? { visitorData: visitorDataOrOpts }
    : visitorDataOrOpts ?? {};

  const vd = opts.visitorData;

  const url = `${API_BASE}/${endpoint}?prettyPrint=false`;
  const res = await fetch(url, {
    method: "POST",
    headers: buildHeaders(client, opts.auth),
    body: JSON.stringify({ context: buildContext(client, vd), ...body }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`InnerTube ${endpoint}: ${res.status}`);
  return res.json();
}

// ---------- Response parsers ----------

function thumbnailUrl(obj: any): string | undefined {
  const thumbs =
    obj?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ??
    obj?.thumbnail?.thumbnails ??
    obj?.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails ??
    [];
  const best = thumbs.at(-1);
  return best?.url?.replace(/=w\d+-h\d+/, "=w512-h512");
}

function runsText(runs: any[] | undefined): string {
  return runs?.map((r: any) => r.text).join("") ?? "";
}

function parseDuration(text: string): number | undefined {
  const parts = text.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return undefined;
}

function browseId(nav: any): string | undefined {
  return nav?.browseEndpoint?.browseId;
}

function watchVideoId(nav: any): string | undefined {
  return (
    nav?.watchEndpoint?.videoId ??
    nav?.watchPlaylistEndpoint?.videoId
  );
}

function pageType(nav: any): string | undefined {
  return nav?.browseEndpoint?.browseEndpointContextSupportedConfigs
    ?.browseEndpointContextMusicConfig?.pageType;
}

function parseFlexColumn(renderer: any, index: number) {
  return renderer?.flexColumns?.[index]
    ?.musicResponsiveListItemFlexColumnRenderer?.text;
}

function parseListItemToTrack(renderer: any): Track | null {
  const col0 = parseFlexColumn(renderer, 0);
  const col1 = parseFlexColumn(renderer, 1);
  if (!col0) return null;

  const title = runsText(col0.runs);
  const nav =
    renderer?.overlay?.musicItemThumbnailOverlayRenderer?.content
      ?.musicPlayButtonRenderer?.playNavigationEndpoint ??
    renderer?.flexColumns?.[0]
      ?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]
      ?.navigationEndpoint;

  const videoId =
    watchVideoId(nav) ??
    renderer?.playlistItemData?.videoId ??
    renderer?.onTap?.watchEndpoint?.videoId;
  if (!videoId) return null;

  const col1Runs = col1?.runs ?? [];
  const groups = splitBySeparator(col1Runs);
  const artists: Track["artists"] = [];
  if (groups[0]) {
    for (const run of groups[0]) {
      if (run.text && run.text !== " & " && run.text !== ", ") {
        artists.push({
          name: run.text,
          id: browseId(run.navigationEndpoint) ?? undefined,
        });
      }
    }
  }

  let albumName: string | undefined;
  let albumId: string | undefined;
  if (groups[1]) {
    albumName = groups[1].map((r: any) => r.text).join("");
    albumId = browseId(groups[1][0]?.navigationEndpoint) ?? undefined;
  }

  let duration: number | undefined;
  const lastGroup = groups.at(-1);
  if (lastGroup?.length === 1) {
    const text = lastGroup[0].text;
    if (/^\d+:\d+/.test(text)) duration = parseDuration(text);
  }
  if (duration === undefined) {
    const fixedCol =
      renderer?.fixedColumns?.[0]
        ?.musicResponsiveListItemFixedColumnRenderer?.text;
    if (fixedCol?.runs?.[0]?.text) {
      duration = parseDuration(fixedCol.runs[0].text);
    }
  }

  return {
    id: videoId,
    title,
    artists,
    album:
      albumName ? { name: albumName, id: albumId } : undefined,
    duration,
    thumbnail: thumbnailUrl(renderer),
    explicit:
      renderer?.badges?.some(
        (b: any) =>
          b.musicInlineBadgeRenderer?.icon?.iconType === "MUSIC_EXPLICIT_BADGE"
      ) ?? false,
  };
}

function parseTwoRowToItem(renderer: any): Track | Album | ArtistSummary | PlaylistSummary | null {
  const nav = renderer?.navigationEndpoint;
  const pt = pageType(nav);
  const title = runsText(renderer?.title?.runs);
  const subtitle = runsText(renderer?.subtitle?.runs);
  const thumb = thumbnailUrl(renderer);

  if (pt === "MUSIC_PAGE_TYPE_ALBUM") {
    const bid = browseId(nav)!;
    const playlistId =
      renderer?.thumbnailOverlay?.musicThumbnailOverlayRenderer?.content
        ?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchPlaylistEndpoint
        ?.playlistId;
    const subtitleRuns = renderer?.subtitle?.runs ?? [];
    const artistRuns = subtitleRuns.filter(
      (r: any) => r.navigationEndpoint && pageType(r.navigationEndpoint) === "MUSIC_PAGE_TYPE_ARTIST"
    );
    const year = subtitleRuns.find((r: any) => /^\d{4}$/.test(r.text))?.text;
    return {
      id: bid,
      title,
      artists: artistRuns.map((r: any) => ({
        name: r.text,
        id: browseId(r.navigationEndpoint),
      })),
      year: year ? Number(year) : undefined,
      thumbnail: thumb,
      playlistId,
    } satisfies Album;
  }

  if (pt === "MUSIC_PAGE_TYPE_ARTIST") {
    return {
      id: browseId(nav)!,
      name: title,
      thumbnail: thumb,
    } satisfies ArtistSummary;
  }

  if (
    pt === "MUSIC_PAGE_TYPE_PLAYLIST" ||
    pt === "MUSIC_PAGE_TYPE_COMMUNITY_PLAYLIST"
  ) {
    return {
      id: browseId(nav) ?? nav?.watchEndpoint?.playlistId ?? "",
      title,
      author: subtitle,
      thumbnail: thumb,
    } satisfies PlaylistSummary;
  }

  const videoId = watchVideoId(nav) ?? watchVideoId(
    renderer?.thumbnailOverlay?.musicThumbnailOverlayRenderer?.content
      ?.musicPlayButtonRenderer?.playNavigationEndpoint
  );
  if (videoId) {
    const subtitleRuns = renderer?.subtitle?.runs ?? [];
    const artists: Track["artists"] = subtitleRuns
      .filter((r: any) => r.text !== " • " && r.text !== " & " && r.text !== ", " && !/^\d/.test(r.text))
      .slice(0, 2)
      .map((r: any) => ({
        name: r.text,
        id: browseId(r.navigationEndpoint),
      }));
    return {
      id: videoId,
      title,
      artists,
      thumbnail: thumb,
    } satisfies Track;
  }

  return null;
}

function splitBySeparator(runs: any[]): any[][] {
  const groups: any[][] = [[]];
  for (const run of runs) {
    if (run.text === " \u2022 " || run.text === " • ") {
      groups.push([]);
    } else {
      groups.at(-1)!.push(run);
    }
  }
  return groups;
}

// ---------- Public API ----------

export async function search(query: string): Promise<{
  tracks: Track[];
  albums: Album[];
  artists: ArtistSummary[];
  playlists: PlaylistSummary[];
}> {
  const data = await post("search", { query, params: null }, WEB_REMIX);

  const tracks: Track[] = [];
  const albums: Album[] = [];
  const artists: ArtistSummary[] = [];
  const playlists: PlaylistSummary[] = [];

  const tabs =
    data?.contents?.tabbedSearchResultsRenderer?.tabs ?? [];
  for (const tab of tabs) {
    const sections =
      tab?.tabRenderer?.content?.sectionListRenderer?.contents ?? [];
    for (const section of sections) {
      const shelf = section?.musicShelfRenderer;
      if (!shelf) continue;
      for (const item of shelf.contents ?? []) {
        const renderer = item.musicResponsiveListItemRenderer;
        if (!renderer) continue;
        const track = parseListItemToTrack(renderer);
        if (track) tracks.push(track);
      }

      const carousel = section?.musicCarouselShelfRenderer;
      if (!carousel) continue;
      for (const item of carousel.contents ?? []) {
        const r = item.musicTwoRowItemRenderer;
        if (!r) continue;
        const parsed = parseTwoRowToItem(r);
        if (!parsed) continue;
        if ("artists" in parsed && "playlistId" in parsed) albums.push(parsed as Album);
        else if ("name" in parsed && !("title" in parsed)) artists.push(parsed as ArtistSummary);
        else if ("author" in parsed) playlists.push(parsed as PlaylistSummary);
      }
    }
  }

  return { tracks, albums, artists, playlists };
}

export async function searchSuggestions(query: string): Promise<string[]> {
  const data = await post(
    "music/get_search_suggestions",
    { input: query },
    WEB_REMIX
  );
  const contents =
    data?.contents ?? [];
  const suggestions: string[] = [];
  for (const item of contents) {
    const renderer = item?.searchSuggestionsSectionRenderer?.contents ?? item?.searchSuggestionRenderer;
    if (Array.isArray(renderer)) {
      for (const r of renderer) {
        const text = runsText(
          r?.searchSuggestionRenderer?.suggestion?.runs ??
            r?.musicResponsiveListItemRenderer?.flexColumns?.[0]
              ?.musicResponsiveListItemFlexColumnRenderer?.text?.runs
        );
        if (text) suggestions.push(text);
      }
    } else {
      const text = runsText(renderer?.suggestion?.runs);
      if (text) suggestions.push(text);
    }
  }
  return suggestions.slice(0, 8);
}

export async function home(auth?: AuthCredentials): Promise<HomeSection[]> {
  const data = auth
    ? await post("browse", { browseId: "FEmusic_home" }, WEB_REMIX, { auth })
    : await post("browse", { browseId: "FEmusic_home" }, WEB_REMIX);

  const sections: HomeSection[] = [];
  const tabs =
    data?.contents?.singleColumnBrowseResultsRenderer?.tabs ?? [];
  for (const tab of tabs) {
    const sectionList =
      tab?.tabRenderer?.content?.sectionListRenderer?.contents ?? [];
    for (const section of sectionList) {
      const carousel = section?.musicCarouselShelfRenderer;
      if (!carousel) continue;
      const title = runsText(
        carousel?.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs
      );
      if (!title) continue;

      const items: HomeSection["items"] = [];
      for (const entry of carousel.contents ?? []) {
        const twoRow = entry.musicTwoRowItemRenderer;
        const listItem = entry.musicResponsiveListItemRenderer;
        if (twoRow) {
          const parsed = parseTwoRowToItem(twoRow);
          if (parsed) items.push(parsed);
        } else if (listItem) {
          const track = parseListItemToTrack(listItem);
          if (track) items.push(track);
        }
      }

      if (items.length === 0) continue;

      let type: HomeSection["type"] = "mixed";
      if (items.every((i) => "artists" in i && "duration" in i)) type = "tracks";
      else if (items.every((i) => "playlistId" in i)) type = "albums";
      else if (items.every((i) => "name" in i && !("title" in i))) type = "artists";
      else if (items.every((i) => "author" in i)) type = "playlists";

      sections.push({ title, items, type });
    }
  }

  return sections;
}

// ---------- Signature deobfuscation ----------

let cachedPlayerJs: { code: string; timestamp: number } | null = null;

async function fetchPlayerJs(): Promise<string> {
  if (cachedPlayerJs && Date.now() - cachedPlayerJs.timestamp < 3_600_000) {
    return cachedPlayerJs.code;
  }
  const html = await fetch("https://music.youtube.com/", {
    headers: { "User-Agent": USER_AGENT },
  }).then((r) => r.text());

  const jsMatch = html.match(/\/s\/player\/([a-f0-9]{8})\/player_ias\.vflset\/[^"]+base\.js/);
  if (!jsMatch) throw new Error("Could not find player JS URL");

  const jsUrl = `https://music.youtube.com${jsMatch[0]}`;
  const code = await fetch(jsUrl, {
    headers: { "User-Agent": USER_AGENT },
  }).then((r) => r.text());

  const stMatch = code.match(/signatureTimestamp[=:](\d+)/);
  cachedPlayerJs = { code, timestamp: Date.now() };
  if (stMatch) {
    (cachedPlayerJs as any).sts = Number(stMatch[1]);
  }
  return code;
}

function extractDeobfuscator(playerJs: string): ((sig: string) => string) | null {
  const fnMatch = playerJs.match(
    /\b[a-zA-Z0-9]+\s*=\s*function\(a\)\{a=a\.split\(""\);([a-zA-Z0-9$]+)\..+?;return a\.join\(""\)\}/
  );
  if (!fnMatch) return null;

  const helperName = fnMatch[1];
  const helperEsc = helperName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const helperMatch = playerJs.match(
    new RegExp(`var ${helperEsc}=\\{[\\s\\S]*?\\};`)
  );
  if (!helperMatch) return null;

  const fullFnMatch = playerJs.match(
    /\b[a-zA-Z0-9]+\s*=\s*function\(a\)\{a=a\.split\(""\);[^}]+;return a\.join\(""\)\}/
  );
  if (!fullFnMatch) return null;

  try {
    const fn = new Function(
      helperMatch[0] +
        "\nvar deobfuscate=" +
        fullFnMatch[0].replace(/^[a-zA-Z0-9]+\s*=\s*/, "") +
        ";\nreturn deobfuscate;"
    );
    return fn() as (sig: string) => string;
  } catch {
    return null;
  }
}

async function resolveUrl(format: any): Promise<string | null> {
  if (format.url) return format.url;

  if (!format.signatureCipher) return null;

  const params = new URLSearchParams(format.signatureCipher);
  const sig = params.get("s");
  const sp = params.get("sp") ?? "sig";
  const baseUrl = params.get("url");
  if (!sig || !baseUrl) return null;

  try {
    const playerJs = await fetchPlayerJs();
    const deobfuscate = extractDeobfuscator(playerJs);
    if (!deobfuscate) return null;

    const decodedSig = deobfuscate(sig);
    const url = new URL(baseUrl);
    url.searchParams.set(sp, decodedSig);
    return url.toString();
  } catch {
    return null;
  }
}

async function getSignatureTimestamp(): Promise<number> {
  try {
    await fetchPlayerJs();
    return (cachedPlayerJs as any)?.sts ?? 0;
  } catch {
    return 0;
  }
}

// ---------- Stream resolution ----------

export async function getStreamInfo(videoId: string): Promise<StreamInfo> {
  const clients: ClientConfig[] = [
    ANDROID_VR,
    ANDROID_VR_NEW,
    ANDROID_CREATOR,
    IPADOS,
    IOS,
    TVHTML5_EMBED,
    WEB_REMIX,
  ];
  let lastError: Error | null = null;

  const visitorData = await getVisitorData();
  let signatureTimestamp: number | undefined;

  for (const client of clients) {
    try {
      const body: Record<string, any> = { videoId };

      if (client.useSignatureTimestamp) {
        if (signatureTimestamp === undefined) {
          signatureTimestamp = await getSignatureTimestamp();
        }
        body.playbackContext = {
          contentPlaybackContext: { signatureTimestamp },
        };
      }

      const data = await post("player", body, client, visitorData);

      const status = data?.playabilityStatus?.status;
      if (status !== "OK" && status !== "CONTENT_CHECK_REQUIRED") {
        throw new Error(
          data?.playabilityStatus?.reason ?? `Playback status: ${status}`
        );
      }

      const formats: any[] = [
        ...(data?.streamingData?.adaptiveFormats ?? []),
        ...(data?.streamingData?.formats ?? []),
      ];

      const audioFormats = formats
        .filter(
          (f: any) =>
            (f.url || f.signatureCipher) &&
            !f.width &&
            f.mimeType?.startsWith("audio/") &&
            f.audioTrack?.audioIsDefault !== false
        )
        .sort((a: any, b: any) => (b.bitrate ?? 0) - (a.bitrate ?? 0));

      if (audioFormats.length === 0) {
        throw new Error(`No audio formats from ${client.clientName} v${client.clientVersion}`);
      }

      const webm = audioFormats.find((f: any) => f.mimeType?.includes("webm"));
      const mp4 = audioFormats.find((f: any) => f.mimeType?.includes("mp4"));
      const best = webm ?? mp4 ?? audioFormats[0];

      const streamUrl = await resolveUrl(best);
      if (!streamUrl) {
        throw new Error(`Could not resolve URL from ${client.clientName} v${client.clientVersion}`);
      }

      const expiresIn = Number(data?.streamingData?.expiresInSeconds ?? 3600);

      console.log(`[innertube:player] OK via ${client.clientName} v${client.clientVersion}`);

      return {
        url: streamUrl,
        mimeType: best.mimeType,
        bitrate: best.bitrate,
        expiresAt: Date.now() + expiresIn * 1000,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(
        `[innertube:player] ${client.clientName} v${client.clientVersion} failed:`,
        lastError.message
      );
    }
  }

  throw lastError ?? new Error("No stream found");
}

export async function getNext(
  videoId: string,
  playlistId?: string
): Promise<Track[]> {
  const body: Record<string, any> = { videoId, isAudioOnly: true };
  if (playlistId) body.playlistId = playlistId;

  const data = await post("next", body, WEB_REMIX);

  const tracks: Track[] = [];
  const tabs =
    data?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer
      ?.watchNextTabbedResultsRenderer?.tabs ?? [];

  for (const tab of tabs) {
    const playlist =
      tab?.tabRenderer?.content?.musicQueueRenderer?.content
        ?.playlistPanelRenderer;
    if (!playlist) continue;
    for (const item of playlist.contents ?? []) {
      const r = item.playlistPanelVideoRenderer;
      if (!r) continue;
      const vid = r.videoId ?? r.navigationEndpoint?.watchEndpoint?.videoId;
      if (!vid) continue;

      const artistRuns = r.shortBylineText?.runs ?? r.longBylineText?.runs ?? [];
      tracks.push({
        id: vid,
        title: runsText(r.title?.runs),
        artists: artistRuns
          .filter((run: any) => run.text !== " & " && run.text !== ", ")
          .map((run: any) => ({
            name: run.text,
            id: browseId(run.navigationEndpoint),
          })),
        duration: parseDuration(runsText(r.lengthText?.runs)),
        thumbnail: r.thumbnail?.thumbnails?.at(-1)?.url?.replace(
          /=w\d+-h\d+/,
          "=w512-h512"
        ),
      });
    }
  }

  return tracks;
}

export async function browsePlaylist(browseIdOrPlaylistId: string): Promise<Track[]> {
  const bid = browseIdOrPlaylistId.startsWith("VL")
    ? browseIdOrPlaylistId
    : `VL${browseIdOrPlaylistId}`;

  const visitorData = await getVisitorData();
  const data = await post("browse", { browseId: bid }, WEB_REMIX, visitorData);

  const shelf =
    data?.contents?.twoColumnBrowseResultsRenderer?.secondaryContents
      ?.sectionListRenderer?.contents?.[0]?.musicPlaylistShelfRenderer;
  const contents = shelf?.contents ?? [];

  const tracks: Track[] = [];
  for (const item of contents) {
    const renderer = item.musicResponsiveListItemRenderer;
    if (!renderer) continue;
    const track = parseListItemToTrack(renderer);
    if (track) tracks.push(track);
  }

  return tracks;
}

// ---------- Authenticated endpoints ----------

export interface LibraryItem {
  type: "playlist" | "artist" | "album";
  id: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  playlistId?: string;
}

export async function libraryBrowse(
  browseIdParam: string,
  auth: AuthCredentials
): Promise<LibraryItem[]> {
  const data = await post("browse", { browseId: browseIdParam }, WEB_REMIX, { auth });

  const items: LibraryItem[] = [];

  const tabs = data?.contents?.singleColumnBrowseResultsRenderer?.tabs ?? [];
  const contents = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0];

  const gridItems = contents?.gridRenderer?.items ?? [];
  for (const entry of gridItems) {
    const r = entry.musicTwoRowItemRenderer;
    if (!r) continue;
    const nav = r.navigationEndpoint;
    const pt = pageType(nav);
    const title = runsText(r.title?.runs);
    const subtitle = runsText(r.subtitle?.runs);
    const thumb = thumbnailUrl(r);
    const bid = browseId(nav);

    if (pt === "MUSIC_PAGE_TYPE_PLAYLIST" || pt === "MUSIC_PAGE_TYPE_COMMUNITY_PLAYLIST") {
      items.push({ type: "playlist", id: bid ?? "", title, subtitle, thumbnail: thumb });
    } else if (pt === "MUSIC_PAGE_TYPE_ARTIST") {
      items.push({ type: "artist", id: bid ?? "", title, subtitle, thumbnail: thumb });
    } else if (pt === "MUSIC_PAGE_TYPE_ALBUM") {
      const plId = r.thumbnailOverlay?.musicThumbnailOverlayRenderer?.content
        ?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchPlaylistEndpoint?.playlistId;
      items.push({ type: "album", id: bid ?? "", title, subtitle, thumbnail: thumb, playlistId: plId });
    }
  }

  const shelfItems = contents?.musicShelfRenderer?.contents ?? [];
  for (const entry of shelfItems) {
    const r = entry.musicResponsiveListItemRenderer;
    if (!r) continue;
    const track = parseListItemToTrack(r);
    if (track) {
      items.push({
        type: "playlist",
        id: track.id,
        title: track.title,
        subtitle: track.artists.map((a) => a.name).join(", "),
        thumbnail: track.thumbnail,
      });
    }
  }

  return items;
}

export async function likedSongs(auth: AuthCredentials): Promise<Track[]> {
  const data = await post("browse", { browseId: "FEmusic_liked_videos" }, WEB_REMIX, { auth });

  const tracks: Track[] = [];

  const tabs = data?.contents?.singleColumnBrowseResultsRenderer?.tabs ?? [];
  const contents = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents ?? [];

  for (const section of contents) {
    const shelf = section?.musicShelfRenderer;
    if (!shelf) continue;
    for (const item of shelf.contents ?? []) {
      const renderer = item.musicResponsiveListItemRenderer;
      if (!renderer) continue;
      const track = parseListItemToTrack(renderer);
      if (track) tracks.push(track);
    }
  }

  return tracks;
}
