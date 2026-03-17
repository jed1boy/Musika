import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { browsePlaylist } from "@/lib/server/music/innertube";

const schema = z.object({ id: z.string().min(1).max(150) });

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

  try {
    const tracks = await browsePlaylist(parsed.data.id);
    return NextResponse.json({ success: true, data: tracks });
  } catch (err) {
    console.error("[api/music/playlist]", err);
    return NextResponse.json(
      { success: false, error: { code: "PLAYLIST_FAILED", message: "Could not load playlist" } },
      { status: 502 }
    );
  }
}
