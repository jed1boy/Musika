import { getSession, updateSession, type YTCredentials } from "./session";
import { refreshAccessToken } from "./google-oauth";

const REFRESH_MARGIN = 5 * 60 * 1000; // refresh 5 min before expiry

export async function getValidAccessToken(sessionId: string): Promise<{ token: string; creds: YTCredentials } | undefined> {
  const creds = getSession(sessionId);
  if (!creds) return undefined;

  if (Date.now() < creds.expiresAt - REFRESH_MARGIN) {
    return { token: creds.accessToken, creds };
  }

  try {
    const refreshed = await refreshAccessToken(creds.refreshToken);
    const newExpiresAt = Date.now() + refreshed.expires_in * 1000;
    updateSession(sessionId, {
      accessToken: refreshed.access_token,
      expiresAt: newExpiresAt,
    });
    return {
      token: refreshed.access_token,
      creds: { ...creds, accessToken: refreshed.access_token, expiresAt: newExpiresAt },
    };
  } catch (err) {
    console.error("[get-access-token] refresh failed:", err);
    return undefined;
  }
}
