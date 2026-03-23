import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins/bearer";

export type AuthEnv = {
  DB: D1Database;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  TRUSTED_ORIGINS?: string;
};

export function createAuth(env: AuthEnv) {
  const extra = (env.TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const trustedOrigins = [...new Set([env.BETTER_AUTH_URL, ...extra])];

  return betterAuth({
    appName: "Musika",
    database: env.DB,
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins,
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    plugins: [bearer()],
  });
}
