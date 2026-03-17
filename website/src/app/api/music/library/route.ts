import { NextRequest, NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/server/session";
import { getValidAccessToken } from "@/lib/server/get-access-token";
import { libraryBrowse } from "@/lib/server/music/innertube";

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(sessionCookieOptions().name)?.value;
  const result = sessionId ? await getValidAccessToken(sessionId) : undefined;

  if (!result) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Sign in to access your library" } },
      { status: 401 }
    );
  }

  const browseId = req.nextUrl.searchParams.get("browseId") ?? "FEmusic_liked_playlists";

  try {
    const items = await libraryBrowse(browseId, { accessToken: result.token });
    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    console.error("[api/music/library]", err);
    return NextResponse.json(
      { success: false, error: { code: "LIBRARY_FAILED", message: "Could not load library" } },
      { status: 502 }
    );
  }
}
