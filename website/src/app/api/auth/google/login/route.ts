import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUrl } from "@/lib/server/google-oauth";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");
  const url = getAuthUrl(state);
  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
