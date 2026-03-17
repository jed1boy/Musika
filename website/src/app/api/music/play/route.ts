import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStreamInfo } from "@/lib/server/music/innertube";

const schema = z.object({ id: z.string().min(1).max(50) });

const streamCache = new Map<string, { url: string; mimeType: string; expiresAt: number }>();

export async function GET(req: NextRequest) {
  const parsed = schema.safeParse({
    id: req.nextUrl.searchParams.get("id"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const videoId = parsed.data.id;

  try {
    let cached = streamCache.get(videoId);
    if (!cached || Date.now() > cached.expiresAt - 30_000) {
      const info = await getStreamInfo(videoId);
      cached = { url: info.url, mimeType: info.mimeType, expiresAt: info.expiresAt };
      streamCache.set(videoId, cached);
    }

    const rangeHeader = req.headers.get("range");
    const upstreamHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
    };
    if (rangeHeader) upstreamHeaders["Range"] = rangeHeader;

    const upstream = await fetch(cached.url, { headers: upstreamHeaders });

    if (!upstream.ok && upstream.status !== 206) {
      streamCache.delete(videoId);
      return NextResponse.json(
        { success: false, error: { code: "UPSTREAM_ERROR", message: `Upstream ${upstream.status}` } },
        { status: 502 }
      );
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", cached.mimeType || "audio/webm");
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Cache-Control", "no-store");

    const cl = upstream.headers.get("content-length");
    if (cl) responseHeaders.set("Content-Length", cl);
    const cr = upstream.headers.get("content-range");
    if (cr) responseHeaders.set("Content-Range", cr);

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[api/music/play]", err);
    streamCache.delete(videoId);
    return NextResponse.json(
      { success: false, error: { code: "STREAM_FAILED", message: "Could not resolve stream" } },
      { status: 502 }
    );
  }
}
