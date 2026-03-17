"use client";

import { Search, X, Loader2 } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { getSuggestions } from "@/lib/player/api";

interface SearchBarProps {
  onSearch: (query: string) => void;
  defaultValue?: string;
}

export function SearchBar({ onSearch, defaultValue = "" }: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getSuggestions(q);
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(q: string) {
    setValue(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 250);
  }

  function submit(q: string) {
    if (!q.trim()) return;
    setShowSuggestions(false);
    onSearch(q.trim());
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="flex items-center gap-3 bg-white/[0.06] border border-white/10 rounded-[18px] px-4 py-2.5 focus-within:border-white/20 transition-colors">
        {loading ? (
          <Loader2 size={18} className="text-white/30 animate-spin shrink-0" />
        ) : (
          <Search size={18} className="text-white/30 shrink-0" />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit(value);
          }}
          placeholder="Search songs, artists, albums..."
          className="flex-1 bg-transparent text-white text-sm md:text-[15px] placeholder:text-white/25 outline-none"
        />
        {value && (
          <button
            onClick={() => {
              setValue("");
              setSuggestions([]);
            }}
            className="p-0.5 text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-white/10 rounded-[14px] overflow-hidden z-50 shadow-2xl">
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors flex items-center gap-3"
              onClick={() => {
                setValue(s);
                submit(s);
              }}
            >
              <Search size={14} className="text-white/20 shrink-0" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
