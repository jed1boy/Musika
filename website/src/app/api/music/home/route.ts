import { NextRequest, NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/server/session";
import { getValidAccessToken } from "@/lib/server/get-access-token";
import { home } from "@/lib/server/music/innertube";

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(sessionCookieOptions().name)?.value;
  const result = sessionId ? await getValidAccessToken(sessionId) : undefined;

  try {
    const auth = result ? { accessToken: result.token } : undefined;
    const sections = await home(auth);
    return NextResponse.json({ success: true, data: sections });
  } catch (err) {
    console.error("[api/music/home]", err);
    return NextResponse.json(
      { success: false, error: { code: "HOME_FAILED", message: "Could not load home feed" } },
      { status: 502 }
    );
  }
}
