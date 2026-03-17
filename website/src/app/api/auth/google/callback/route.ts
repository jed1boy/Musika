import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, getUserInfo } from "@/lib/server/google-oauth";
import { createSession, sessionCookieOptions } from "@/lib/server/session";

export const runtime = "nodejs";

function redirectUrl(req: NextRequest, path: string): string {
  const origin = req.nextUrl.origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("oauth_state")?.value;

  const failRedirect = () =>
    NextResponse.redirect(redirectUrl(req, "/listen?error=auth_failed"));

  if (!code || !state || state !== storedState) {
    return failRedirect();
  }

  try {
    const tokens = await exchangeCode(code);
    const userInfo = await getUserInfo(tokens.access_token);

    const sessionId = createSession({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      accountName: userInfo.name,
      accountEmail: userInfo.email,
      accountThumbnail: userInfo.picture,
      createdAt: Date.now(),
    });

    const opts = sessionCookieOptions();
    const res = NextResponse.redirect(redirectUrl(req, "/listen"));
    res.cookies.set(opts.name, sessionId, opts);
    res.cookies.delete("oauth_state");
    return res;
  } catch (err) {
    console.error("[auth/google/callback]", err);
    return failRedirect();
  }
}
