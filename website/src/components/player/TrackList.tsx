"use client";

import type { Track } from "@/lib/player/types";
import { TrackRow } from "./TrackRow";
import { usePlayerActions } from "./PlayerProvider";

interface TrackListProps {
  tracks: Track[];
  showIndex?: boolean;
  title?: string;
}

export function TrackList({ tracks, showIndex, title }: TrackListProps) {
  const actions = usePlayerActions();

  return (
    <div>
      {title && (
        <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-6 md:mb-8">
          {title}
        </h2>
      )}
      <div className="flex flex-col gap-0.5">
        {tracks.map((track, i) => (
          <TrackRow
            key={`${track.id}-${i}`}
            track={track}
            index={i}
            showIndex={showIndex}
            onPlay={() => actions.playTracks(tracks, i)}
          />
        ))}
      </div>
    </div>
  );
}
