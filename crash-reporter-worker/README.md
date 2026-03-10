# Musika Crash Reporter Worker

Cloudflare Worker endpoint that receives Android crash payloads and stores them in Turso.

## Required secrets

Set these secrets before deploy:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

Example:

```bash
wrangler secret put TURSO_DATABASE_URL
wrangler secret put TURSO_AUTH_TOKEN
```

## Database schema

Apply migration in `migrations/001_create_crash_logs.sql` to your Turso database before first use.

Example using Turso CLI:

```bash
turso db shell <your_database_name> < migrations/001_create_crash_logs.sql
```

## Local dev

```bash
npm run dev
```

## Deploy

```bash
npm run deploy
```

## Endpoints

- `GET /health`
- `POST /api/crash-report`

## Local-only dashboard

Run the dashboard locally from the repository root:

```bash
python tools/local_crash_dashboard.py
```

Required environment variables for local dashboard:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

Open `http://127.0.0.1:8788/logs`.
