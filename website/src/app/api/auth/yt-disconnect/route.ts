import { NextRequest, NextResponse } from "next/server";
import { deleteSession, sessionCookieOptions } from "@/lib/server/session";

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get(sessionCookieOptions().name)?.value;
  if (sessionId) deleteSession(sessionId);

  const opts = sessionCookieOptions();
  const res = NextResponse.json({ success: true, data: null });
  res.cookies.set(opts.name, "", { ...opts, maxAge: 0 });
  return res;
}
