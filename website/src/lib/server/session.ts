import crypto from "crypto";

export interface YTCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  accountName?: string;
  accountEmail?: string;
  accountThumbnail?: string;
  createdAt: number;
}

const SESSION_COOKIE = "musika_session";
const SESSION_TTL = 30 * 24 * 3600 * 1000; // 30 days

const store = new Map<string, YTCredentials>();

function generateId(): string {
  return crypto.randomBytes(32).toString("hex");
}

function pruneExpired() {
  const now = Date.now();
  for (const [id, cred] of store) {
    if (now - cred.createdAt > SESSION_TTL) store.delete(id);
  }
}

export function createSession(creds: YTCredentials): string {
  pruneExpired();
  const id = generateId();
  store.set(id, creds);
  return id;
}

export function getSession(id: string): YTCredentials | undefined {
  const creds = store.get(id);
  if (!creds) return undefined;
  if (Date.now() - creds.createdAt > SESSION_TTL) {
    store.delete(id);
    return undefined;
  }
  return creds;
}

export function deleteSession(id: string): void {
  store.delete(id);
}

export function updateSession(id: string, patch: Partial<YTCredentials>): void {
  const existing = store.get(id);
  if (existing) store.set(id, { ...existing, ...patch });
}

export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL / 1000,
  };
}
