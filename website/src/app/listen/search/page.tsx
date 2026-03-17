"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { searchTracks } from "@/lib/player/api";
import { TrackList } from "@/components/player/TrackList";
import { ListenHeader } from "../ListenHeader";
import type { SearchResults } from "@/lib/player/types";

function SearchResultsInner({ query }: { query: string }) {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    searchTracks(query)
      .then((data) => {
        if (!cancelled) {
          setResults(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [query]);

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
        <p className="text-lg">Search failed</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-white/40 hover:text-white/60 transition-colors underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!results || results.tracks.length === 0) {
    return (
      <div className="flex items-center justify-center py-32 text-white/20">
        <p className="text-lg">No results for &ldquo;{query}&rdquo;</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-2">
          Results for &ldquo;{query}&rdquo;
        </h1>
        <p className="text-sm text-white/30">
          {results.tracks.length} track{results.tracks.length !== 1 ? "s" : ""} found
        </p>
      </div>
      <TrackList tracks={results.tracks} showIndex />
    </div>
  );
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";

  if (!query) {
    return (
      <div className="flex items-center justify-center py-32 text-white/20">
        <p className="text-lg">Search for songs, artists, albums...</p>
      </div>
    );
  }

  return <SearchResultsInner key={query} query={query} />;
}

export default function SearchPage() {
  return (
    <>
      <ListenHeader />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 pt-6 pb-40">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-32">
              <Loader2 size={28} className="animate-spin text-white/20" />
            </div>
          }
        >
          <SearchResultsContent />
        </Suspense>
      </main>
    </>
  );
}
