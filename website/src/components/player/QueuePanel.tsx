"use client";

import Image from "next/image";
import { ListMusic, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerState, usePlayerActions } from "./PlayerProvider";

interface QueuePanelProps {
  open: boolean;
  onClose: () => void;
}

function formatDuration(seconds?: number) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function QueuePanel({ open, onClose }: QueuePanelProps) {
  const state = usePlayerState();
  const actions = usePlayerActions();
  const upcoming = state.queue.slice(state.queueIndex + 1);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-neutral-950 border-l border-white/10 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <ListMusic size={18} className="text-white/50" />
                <h2 className="text-lg font-medium tracking-tight">Queue</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-white/40 hover:text-white/70 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {state.currentTrack && (
                <div className="px-4 pt-4 pb-2">
                  <p className="text-xs font-medium text-white/30 uppercase tracking-widest mb-3">
                    Now Playing
                  </p>
                  <div className="flex items-center gap-3 p-3 bg-white/[0.06] rounded-[14px]">
                    {state.currentTrack.thumbnail && (
                      <Image
                        src={state.currentTrack.thumbnail}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="w-10 h-10 rounded-[8px] object-cover bg-white/5"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {state.currentTrack.title}
                      </p>
                      <p className="text-xs text-white/40 truncate">
                        {state.currentTrack.artists.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {upcoming.length > 0 && (
                <div className="px-4 pt-4 pb-20">
                  <p className="text-xs font-medium text-white/30 uppercase tracking-widest mb-3">
                    Up Next ({upcoming.length})
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {upcoming.map((track) => (
                      <div
                        key={track.queueId}
                        className="group flex items-center gap-3 p-2.5 rounded-[12px] hover:bg-white/[0.04] transition-colors"
                      >
                        {track.thumbnail && (
                          <Image
                            src={track.thumbnail}
                            alt=""
                            width={36}
                            height={36}
                            unoptimized
                            className="w-9 h-9 rounded-[8px] object-cover bg-white/5"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate text-white/80">
                            {track.title}
                          </p>
                          <p className="text-xs text-white/30 truncate">
                            {track.artists.map((a) => a.name).join(", ")}
                          </p>
                        </div>
                        <span className="text-xs text-white/20 tabular-nums shrink-0">
                          {formatDuration(track.duration)}
                        </span>
                        <button
                          onClick={() => actions.removeFromQueue(track.queueId)}
                          className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/60"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {upcoming.length === 0 && !state.currentTrack && (
                <div className="flex flex-col items-center justify-center h-64 text-white/20">
                  <ListMusic size={40} strokeWidth={1} />
                  <p className="mt-4 text-sm">Queue is empty</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
