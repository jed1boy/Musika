import { NextRequest, NextResponse } from "next/server";
import { getSession, sessionCookieOptions } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(sessionCookieOptions().name)?.value;
  const creds = sessionId ? getSession(sessionId) : undefined;

  if (!creds) {
    return NextResponse.json({
      success: true,
      data: { connected: false },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      connected: true,
      name: creds.accountName,
      thumbnail: creds.accountThumbnail,
    },
  });
}
