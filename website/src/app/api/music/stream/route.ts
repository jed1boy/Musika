import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStreamInfo } from "@/lib/server/music/innertube";

const schema = z.object({ id: z.string().min(1).max(50) });

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
    const stream = await getStreamInfo(parsed.data.id);
    return NextResponse.json({ success: true, data: stream });
  } catch (err) {
    console.error("[api/music/stream]", err);
    return NextResponse.json(
      { success: false, error: { code: "STREAM_FAILED", message: "Could not resolve stream" } },
      { status: 502 }
    );
  }
}
