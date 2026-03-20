"use client";

import Image from "next/image";
import { Disc3, Library, User } from "lucide-react";
import { useCallback, useState } from "react";
import { normalizeThumbnailUrl } from "@/lib/player/thumbnail-url";

export type AlbumArtProps = {
  src: string | undefined | null;
  alt?: string;
  /** Fixed pixel size (mutually exclusive with fill). */
  width?: number;
  height?: number;
  /** Fill parent; parent must be `relative` with defined size or aspect ratio. */
  fill?: boolean;
  sizes?: string;
  className?: string;
  imgClassName?: string;
  /** Placeholder when missing or failed: disc (tracks), user (avatars), library (playlists). */
  placeholder?: "disc" | "user" | "library";
};

type InnerProps = AlbumArtProps & { normalized: string | undefined };

/**
 * Cover art with CDN-safe URL normalization, load fade-in, and placeholder on failure.
 * Opacity transitions stay under 300ms with ease-out; respects prefers-reduced-motion.
 */
function AlbumArtInner({
  normalized,
  alt = "",
  width,
  height,
  fill = false,
  sizes = "64px",
  className = "",
  imgClassName = "",
  placeholder = "disc",
}: InnerProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const showImage = Boolean(normalized && !failed);

  const onError = useCallback(() => {
    setFailed(true);
    setLoaded(false);
  }, []);

  const iconSize = fill
    ? 40
    : Math.max(14, Math.min(width ?? 44, height ?? 44) * 0.42);

  const PlaceholderIcon =
    placeholder === "user" ? User : placeholder === "library" ? Library : Disc3;
  const iconClass =
    placeholder === "user"
      ? "text-white/35"
      : placeholder === "library"
        ? "text-white/25"
        : "text-white/20";

  const shell =
    "relative overflow-hidden bg-gradient-to-br from-white/[0.1] to-white/[0.03] ring-1 ring-white/[0.08] " +
    className;

  const placeholderVisible = !showImage || !loaded;

  const imageOpacity =
    "absolute inset-0 size-full object-cover transition-opacity duration-200 ease-out motion-reduce:transition-none " +
    (loaded ? "opacity-100" : "opacity-0") +
    (imgClassName ? ` ${imgClassName}` : "");

  const inner = (
    <>
      {showImage && fill ? (
        <Image
          src={normalized!}
          alt={alt}
          fill
          unoptimized
          sizes={sizes}
          onLoad={() => setLoaded(true)}
          onError={onError}
          className={imageOpacity}
        />
      ) : null}
      {showImage && !fill && width != null && height != null ? (
        <Image
          src={normalized!}
          alt={alt}
          width={width}
          height={height}
          unoptimized
          sizes={sizes}
          onLoad={() => setLoaded(true)}
          onError={onError}
          className={imageOpacity}
        />
      ) : null}
      <div
        className={
          "absolute inset-0 flex items-center justify-center transition-opacity duration-200 ease-out motion-reduce:transition-none " +
          (placeholderVisible ? "opacity-100" : "opacity-0 pointer-events-none")
        }
        aria-hidden
      >
        <PlaceholderIcon
          className={iconClass}
          size={iconSize}
          strokeWidth={placeholder === "user" ? 1.5 : 1.25}
        />
      </div>
    </>
  );

  if (fill) {
    return <div className={`${shell} size-full min-h-0 min-w-0`}>{inner}</div>;
  }

  const w = width ?? 44;
  const h = height ?? 44;
  return (
    <div className={shell} style={{ width: w, height: h }}>
      {inner}
    </div>
  );
}

export function AlbumArt(props: AlbumArtProps) {
  const normalized = normalizeThumbnailUrl(props.src);
  return (
    <AlbumArtInner
      key={normalized ?? "__empty__"}
      {...props}
      normalized={normalized}
    />
  );
}
