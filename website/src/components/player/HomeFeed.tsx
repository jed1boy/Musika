"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AlbumArt } from "./AlbumArt";
import type { HomeSection, Track, Album, ArtistSummary, PlaylistSummary } from "@/lib/player/types";
import { formatArtists } from "@/lib/player/format-artists";
import { normalizeThumbnailUrl, trackThumbnailUrl } from "@/lib/player/thumbnail-url";
import { getHomeFeed, getPlaylistTracks } from "@/lib/player/api";
import { TrackRow } from "./TrackRow";
import { usePlayerActions } from "./PlayerProvider";

type SectionItem = Track | Album | ArtistSummary | PlaylistSummary;

/** Video tracks only — albums also have id/title/artists but carry a watch `playlistId`. */
function isTrack(item: SectionItem): item is Track {
  if (!("id" in item && "artists" in item && "title" in item)) return false;
  const pl = "playlistId" in item ? (item as Album).playlistId : undefined;
  if (typeof pl === "string" && pl.length > 0) return false;
  return true;
}

function isAlbum(item: SectionItem): item is Album {
  return "playlistId" in item && "title" in item && !("author" in item);
}

function isPlaylist(item: SectionItem): item is PlaylistSummary {
  return "author" in item;
}

function isArtist(item: SectionItem): item is ArtistSummary {
  return "name" in item && !("title" in item) && !("author" in item);
}

function getCardProps(item: SectionItem) {
  const raw = item as unknown as Record<string, unknown>;
  const thumb = isTrack(item as SectionItem)
    ? trackThumbnailUrl(item as Track)
    : normalizeThumbnailUrl((raw.thumbnail as string) ?? undefined);
  const title = (raw.title as string) ?? (raw.name as string) ?? "";
  let subtitle: string | undefined;
  if ("artists" in item) {
    subtitle = formatArtists(item as Pick<Track, "artists">) || undefined;
  } else if ("author" in item) {
    subtitle = raw.author as string;
  }
  return { thumb, title, subtitle };
}

function SectionCard({
  item,
  onPlay,
}: {
  item: SectionItem;
  onPlay: () => void;
}) {
  const { thumb, title, subtitle } = getCardProps(item);

  return (
    <button
      type="button"
      onClick={onPlay}
      className="group flex flex-col gap-2.5 p-2 rounded-[14px] hover:bg-white/[0.04] transition-colors duration-200 ease-out cursor-pointer w-40 md:w-44 shrink-0 text-left motion-safe:active:scale-[0.98] motion-reduce:active:scale-100"
    >
      <div className="relative w-full aspect-square rounded-[12px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.07]">
        <AlbumArt
          src={thumb}
          alt=""
          fill
          sizes="(max-width: 768px) 42vw, 176px"
          className="rounded-[12px]"
        />
      </div>
      <div className="px-1">
        <p className="text-sm font-medium truncate text-white/80">{title}</p>
        {subtitle && (
          <p className="text-xs text-white/30 truncate">{subtitle}</p>
        )}
      </div>
    </button>
  );
}

export function HomeFeed() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const actions = usePlayerActions();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    getHomeFeed()
      .then((data) => {
        if (!cancelled) {
          setSections(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCardClick = useCallback(
    async (item: SectionItem) => {
      if (isArtist(item)) {
        router.push(`/listen/search?q=${encodeURIComponent(item.name)}`);
        return;
      }

      if (isPlaylist(item)) {
        try {
          const tracks = await getPlaylistTracks(item.id);
          if (tracks.length > 0) actions.playTracks(tracks);
        } catch (err) {
          console.error("Failed to load playlist:", err);
        }
        return;
      }

      if (isAlbum(item)) {
        const id = item.playlistId ?? item.id;
        if (!id) return;
        try {
          const tracks = await getPlaylistTracks(id);
          if (tracks.length > 0) actions.playTracks(tracks);
        } catch (err) {
          console.error("Failed to load playlist:", err);
        }
        return;
      }

      if (isTrack(item)) {
        actions.playTrack(item);
      }
    },
    [actions, router]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-white/20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-white/20">
        <p className="text-lg">Could not load home feed</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-white/40 hover:text-white/60 transition-colors underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 md:gap-14">
      {sections.map((section, i) => (
        <div key={i}>
          <h2 className="text-xl md:text-2xl font-medium tracking-tight mb-4 md:mb-6">
            {section.title}
          </h2>

          {section.type === "tracks" ? (
            <div className="flex flex-col gap-0.5">
              {(section.items as Track[]).slice(0, 8).map((track, j) => (
                <TrackRow
                  key={`${track.id}-${j}`}
                  track={track}
                  onPlay={() =>
                    actions.playTracks(section.items as Track[], j)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
              {section.items.map((item, j) =>
                isTrack(item) ? (
                  <TrackRow
                    key={`${i}-${j}`}
                    track={item}
                    onPlay={() => actions.playTrack(item)}
                  />
                ) : (
                  <SectionCard
                    key={`${i}-${j}`}
                    item={item}
                    onPlay={() => handleCardClick(item)}
                  />
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
