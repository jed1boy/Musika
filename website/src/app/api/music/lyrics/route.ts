import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLyrics } from "@/lib/server/music/lyrics";

const schema = z.object({
  title: z.string().min(1).max(300),
  artist: z.string().min(1).max(300),
  duration: z.coerce.number().optional(),
});

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const parsed = schema.safeParse({
    title: sp.get("title"),
    artist: sp.get("artist"),
    duration: sp.get("duration") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  try {
    const result = await getLyrics(
      parsed.data.title,
      parsed.data.artist,
      parsed.data.duration
    );
    if (!result) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "No lyrics found" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("[api/music/lyrics]", err);
    return NextResponse.json(
      { success: false, error: { code: "LYRICS_FAILED", message: "Lyrics fetch failed" } },
      { status: 502 }
    );
  }
}
