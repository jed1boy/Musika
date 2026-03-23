# Musika auth worker (Better Auth on Cloudflare)

Better Auth runs on a Cloudflare Worker with D1. The Android app signs in with a Google **ID token** (Credential Manager) via `POST /api/auth/sign-in/social`, then uses the returned **bearer** token on `Authorization: Bearer …` for `/api/me` and future Musika APIs.

## One-time setup

1. **D1** — Create a database and put its id in `wrangler.toml`:

   ```bash
   npx wrangler d1 create musika-auth
   ```

   Replace `database_id` under `[[d1_databases]]`.

2. **Secrets** (production):

   ```bash
   npx wrangler secret put BETTER_AUTH_SECRET   # min 32 chars, e.g. openssl rand -base64 32
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   ```

3. **Vars** — In the Cloudflare dashboard (or `wrangler.toml` `[vars]`), set:

   - `BETTER_AUTH_URL` — Public URL of this worker, no trailing slash (e.g. `https://musika-auth.<subdomain>.workers.dev`).
   - `GOOGLE_CLIENT_ID` — OAuth **Web client** ID (same as Android `MUSIKA_GOOGLE_WEB_CLIENT_ID`).
   - `TRUSTED_ORIGINS` — Optional comma-separated extra origins.
   - Set `ALLOW_MIGRATE` to `false` after the first successful migration.

4. **Local dev** — Copy `.dev.vars.example` to `.dev.vars` and fill values. Run:

   ```bash
   npm install
   npm run dev
   ```

   Then apply schema once:

   ```bash
   curl -X POST http://127.0.0.1:8787/internal/migrate
   ```

## Google Cloud Console

1. **APIs & Services → Credentials → Create OAuth client → Web application**
   - Authorized redirect URIs: `https://<your-worker-host>/api/auth/callback/google`
   - For local dev with tunnel, add the same path on your tunnel URL.
2. **Create OAuth client → Android** (package `com.musika.app` / `com.musika.app.debug`, SHA-1 of your signing keys) so Google Sign-In / Play Services can issue ID tokens.
3. Use the **Web client**’s client ID as `GOOGLE_CLIENT_ID` on the worker and as `MUSIKA_GOOGLE_WEB_CLIENT_ID` in the app (`gradle.properties`). The Android client ID is only for Play Services; the ID token is minted for the web client audience.

## Endpoints

| Method | Path | Notes |
|--------|------|--------|
| POST | `/internal/migrate` | Only when `ALLOW_MIGRATE=true` |
| * | `/api/auth/*` | Better Auth (sign-in, sign-out, OAuth callback, …) |
| GET | `/api/me` | Session via cookie or `Authorization: Bearer` |

## Android

Configure `MUSIKA_AUTH_BASE_URL` and `MUSIKA_GOOGLE_WEB_CLIENT_ID` in `gradle.properties`. YouTube Music login in the app remains separate (WebView / InnerTube).
