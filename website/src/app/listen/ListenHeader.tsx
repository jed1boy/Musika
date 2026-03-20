"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Heart, Library } from "lucide-react";
import { AlbumArt } from "@/components/player/AlbumArt";
import { SearchBar } from "@/components/player/SearchBar";
import { useAuth } from "@/components/player/AuthProvider";

function AccountChip() {
  const { status, signIn, disconnect } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!status.connected) {
    return (
      <button
        type="button"
        onClick={signIn}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 text-sm text-white/60 hover:text-white/90 hover:border-white/20 transition-all duration-200 ease-out shrink-0 motion-safe:active:scale-[0.98]"
      >
        <User size={16} />
        <span className="hidden sm:inline">Sign in</span>
      </button>
    );
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full hover:bg-white/5 transition-colors duration-200 ease-out p-1 pr-2 motion-safe:active:scale-[0.98] motion-reduce:active:scale-100"
      >
        <div className="relative w-7 h-7 shrink-0 rounded-full overflow-hidden ring-1 ring-white/10">
          <AlbumArt
            src={status.thumbnail}
            alt=""
            fill
            sizes="28px"
            placeholder="user"
            className="rounded-full"
            imgClassName="rounded-full"
          />
        </div>
        <span className="text-sm text-white/70 max-w-[120px] truncate hidden sm:block">
          {status.name}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-30">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-sm font-medium truncate">{status.name}</p>
          </div>
          <button
            onClick={() => { setOpen(false); router.push("/listen/liked"); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors"
          >
            <Heart size={16} />
            Liked songs
          </button>
          <button
            onClick={() => { setOpen(false); router.push("/listen/library"); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors"
          >
            <Library size={16} />
            Library
          </button>
          <button
            onClick={() => { setOpen(false); disconnect(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-white/5 transition-colors border-t border-white/5"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function ListenHeader() {
  const router = useRouter();

  function handleSearch(query: string) {
    router.push(`/listen/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 py-3 md:py-4 flex items-center gap-4 md:gap-8">
        <a
          href="/listen"
          className="text-xl font-bold tracking-tighter shrink-0 hover:opacity-80 transition-opacity"
        >
          M.
        </a>
        <SearchBar onSearch={handleSearch} />
        <AccountChip />
      </div>
    </header>
  );
}
