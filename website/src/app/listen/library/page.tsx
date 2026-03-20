"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AlbumArt } from "@/components/player/AlbumArt";
import { useAuth } from "@/components/player/AuthProvider";
import { getLibrary, getPlaylistTracks } from "@/lib/player/api";
import { usePlayerActions } from "@/components/player/PlayerProvider";
import { ListenHeader } from "../ListenHeader";
import type { LibraryItem } from "@/lib/player/types";
import { useRouter } from "next/navigation";

function LibraryCard({ item, onClick }: { item: LibraryItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.04] transition-colors duration-200 ease-out w-full text-left motion-safe:active:scale-[0.99] motion-reduce:active:scale-100"
    >
      <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden shadow-md shadow-black/30 ring-1 ring-white/[0.08]">
        <AlbumArt
          src={item.thumbnail}
          alt=""
          fill
          sizes="56px"
          placeholder="library"
          className="rounded-lg"
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate text-white/80">{item.title}</p>
        {item.subtitle && (
          <p className="text-xs text-white/30 truncate mt-0.5">{item.subtitle}</p>
        )}
        <p className="text-xs text-white/20 mt-0.5 capitalize">{item.type}</p>
      </div>
    </button>
  );
}

export default function LibraryPage() {
  const { status, loading: authLoading } = useAuth();
  const actions = usePlayerActions();
  const router = useRouter();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!status.connected) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getLibrary()
      .then((data) => {
        if (!cancelled) { setItems(data); setLoading(false); }
      })
      .catch(() => {
        if (!cancelled) { setError(true); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [status.connected, authLoading]);

  async function handleClick(item: LibraryItem) {
    if (item.type === "artist") {
      router.push(`/listen/search?q=${encodeURIComponent(item.title)}`);
      return;
    }
    const id = item.playlistId ?? item.id;
    if (!id) return;
    try {
      const tracks = await getPlaylistTracks(id);
      if (tracks.length > 0) actions.playTracks(tracks);
    } catch (err) {
      console.error("Failed to load playlist:", err);
    }
  }

  return (
    <>
      <ListenHeader />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-10 pb-36">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Library</h1>

        {!status.connected && !authLoading ? (
          <p className="text-white/30 text-center py-20">
            Sign in to access your YouTube Music library.
          </p>
        ) : loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={28} className="animate-spin text-white/20" />
          </div>
        ) : error ? (
          <p className="text-white/30 text-center py-20">Could not load library.</p>
        ) : items.length === 0 ? (
          <p className="text-white/30 text-center py-20">Your library is empty.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {items.map((item, i) => (
              <LibraryCard key={`${item.id}-${i}`} item={item} onClick={() => handleClick(item)} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
