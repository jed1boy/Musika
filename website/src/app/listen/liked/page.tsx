"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/player/AuthProvider";
import { getLikedSongs } from "@/lib/player/api";
import { TrackRow } from "@/components/player/TrackRow";
import { usePlayerActions } from "@/components/player/PlayerProvider";
import { ListenHeader } from "../ListenHeader";
import type { Track } from "@/lib/player/types";

export default function LikedPage() {
  const { status, loading: authLoading } = useAuth();
  const actions = usePlayerActions();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!status.connected) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getLikedSongs()
      .then((data) => {
        if (!cancelled) { setTracks(data); setLoading(false); }
      })
      .catch(() => {
        if (!cancelled) { setError(true); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [status.connected, authLoading]);

  return (
    <>
      <ListenHeader />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-10 pb-36">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Liked Songs</h1>

        {!status.connected && !authLoading ? (
          <p className="text-white/30 text-center py-20">
            Sign in to see your liked songs.
          </p>
        ) : loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={28} className="animate-spin text-white/20" />
          </div>
        ) : error ? (
          <p className="text-white/30 text-center py-20">Could not load liked songs.</p>
        ) : tracks.length === 0 ? (
          <p className="text-white/30 text-center py-20">No liked songs yet.</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {tracks.map((track, i) => (
              <TrackRow
                key={`${track.id}-${i}`}
                track={track}
                onPlay={() => actions.playTracks(tracks, i)}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
