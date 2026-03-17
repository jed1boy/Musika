import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getNext } from "@/lib/server/music/innertube";

const schema = z.object({
  videoId: z.string().min(1).max(50),
  playlistId: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  const parsed = schema.safeParse({
    videoId: req.nextUrl.searchParams.get("videoId") ?? undefined,
    playlistId: req.nextUrl.searchParams.get("playlistId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  try {
    const tracks = await getNext(parsed.data.videoId, parsed.data.playlistId);
    return NextResponse.json({ success: true, data: tracks });
  } catch (err) {
    console.error("[api/music/queue]", err);
    return NextResponse.json(
      { success: false, error: { code: "QUEUE_FAILED", message: "Could not load queue" } },
      { status: 502 }
    );
  }
}
