import { Hono } from "hono";
import { getMigrations } from "better-auth/db/migration";
import { createAuth, type AuthEnv } from "./auth";

type Env = AuthEnv & {
  ALLOW_MIGRATE?: string;
};

const app = new Hono<{ Bindings: Env }>();

app.post("/internal/migrate", async (c) => {
  if (c.env.ALLOW_MIGRATE !== "true") {
    return c.json({ error: "Not found" }, 404);
  }
  try {
    const auth = createAuth(c.env);
    const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);
    if (toBeCreated.length === 0 && toBeAdded.length === 0) {
      return c.json({ message: "No migrations needed" });
    }
    await runMigrations();
    return c.json({
      message: "Migrations completed",
      created: toBeCreated.map((t) => t.table),
      added: toBeAdded.map((t) => t.table),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Migration failed";
    return c.json({ error: message }, 500);
  }
});

app.on(["GET", "POST", "OPTIONS"], "/api/auth/*", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

app.get("/api/me", async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return c.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  });
});

export default app;
