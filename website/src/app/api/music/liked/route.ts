import { NextRequest, NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/server/session";
import { getValidAccessToken } from "@/lib/server/get-access-token";
import { likedSongs } from "@/lib/server/music/innertube";

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(sessionCookieOptions().name)?.value;
  const result = sessionId ? await getValidAccessToken(sessionId) : undefined;

  if (!result) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Sign in to access liked songs" } },
      { status: 401 }
    );
  }

  try {
    const tracks = await likedSongs({ accessToken: result.token });
    return NextResponse.json({ success: true, data: tracks });
  } catch (err) {
    console.error("[api/music/liked]", err);
    return NextResponse.json(
      { success: false, error: { code: "LIKED_FAILED", message: "Could not load liked songs" } },
      { status: 502 }
    );
  }
}
