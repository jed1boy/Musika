const MAX_STACK_LENGTH = 12000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function sanitizeText(value, fallback = "N/A") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function sanitizeStackTrace(value) {
  const stack = sanitizeText(value, "No stack trace available.");
  if (stack.length <= MAX_STACK_LENGTH) return stack;
  return `${stack.slice(0, MAX_STACK_LENGTH)}\n\n...[truncated]`;
}

function sanitizeIsoDate(value) {
  const text = sanitizeText(value, "");
  if (!text) return new Date().toISOString();
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function parsePayload(body) {
  if (!body || typeof body !== "object") {
    return { valid: false, reason: "Invalid JSON body." };
  }

  const stackTrace = sanitizeStackTrace(body.stackTrace);
  const appVersion = sanitizeText(body.appVersion, "unknown");
  const packageName = sanitizeText(body.packageName, "unknown");
  const versionCode = sanitizeText(body.versionCode, "unknown");
  const androidVersion = sanitizeText(body.androidVersion, "unknown");
  const manufacturer = sanitizeText(body.manufacturer, "unknown");
  const model = sanitizeText(body.model, "unknown");
  const threadName = sanitizeText(body.threadName, "unknown");
  const processName = sanitizeText(body.processName, "unknown");
  const architecture = sanitizeText(body.architecture, "unknown");
  const occurredAt = sanitizeIsoDate(body.occurredAt);

  return {
    valid: true,
    payload: {
      stackTrace,
      appVersion,
      packageName,
      versionCode,
      androidVersion,
      manufacturer,
      model,
      threadName,
      processName,
      architecture,
      occurredAt,
      rawPayload: body,
    },
  };
}

function toTursoArg(value) {
  if (value === null || value === undefined) return { type: "null" };
  if (typeof value === "number") {
    if (Number.isInteger(value)) return { type: "integer", value: String(value) };
    return { type: "float", value };
  }
  if (typeof value === "boolean") return { type: "integer", value: value ? "1" : "0" };
  return { type: "text", value: String(value) };
}

async function tursoExecute(env, sql, args = []) {
  if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
    throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN.");
  }

  const response = await fetch(`${env.TURSO_DATABASE_URL}/v2/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.TURSO_AUTH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          type: "execute",
          stmt: {
            sql,
            args: args.map(toTursoArg),
          },
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Turso request failed (${response.status}): ${JSON.stringify(data)}`);
  }

  const result = data?.results?.[0]?.response?.result;
  if (!result || data?.results?.[0]?.type === "error") {
    throw new Error(`Turso error: ${JSON.stringify(data?.results?.[0] || data)}`);
  }

  return result;
}

async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function handleCrashReport(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Malformed JSON body." }, 400);
  }

  const parsed = parsePayload(body);
  if (!parsed.valid) {
    return json({ error: parsed.reason }, 400);
  }

  const payload = parsed.payload;
  const id = crypto.randomUUID();
  const fingerprint = (
    await sha256Hex(
      `${payload.packageName}|${payload.appVersion}|${payload.model}|${payload.stackTrace.slice(0, 500)}`,
    )
  ).slice(0, 24);

  await tursoExecute(
    env,
    `INSERT INTO crash_logs (
      id, created_at, occurred_at, app_version, package_name, version_code,
      android_version, manufacturer, model, architecture, thread_name,
      process_name, stack_trace, fingerprint, payload_json, is_archived, deleted_at
    ) VALUES (
      ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL
    )`,
    [
      id,
      payload.occurredAt,
      payload.appVersion,
      payload.packageName,
      payload.versionCode,
      payload.androidVersion,
      payload.manufacturer,
      payload.model,
      payload.architecture,
      payload.threadName,
      payload.processName,
      payload.stackTrace,
      fingerprint,
      JSON.stringify(payload.rawPayload || {}),
    ],
  );

  return json({ ok: true, id });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method.toUpperCase();

    if (method === "GET" && pathname === "/health") {
      try {
        await tursoExecute(env, "SELECT 1 AS ok");
        return json({ ok: true });
      } catch (error) {
        return json({ ok: false, error: String(error?.message || error) }, 500);
      }
    }

    if (method === "POST" && pathname === "/api/crash-report") {
      try {
        return await handleCrashReport(request, env);
      } catch (error) {
        return json({ error: `Failed to store crash report: ${error?.message || error}` }, 502);
      }
    }

    return json({ error: "Not found." }, 404);
  },

  async scheduled(event, env, ctx) {
    await tursoExecute(
      env,
      `UPDATE crash_logs SET deleted_at = datetime('now')
       WHERE deleted_at IS NULL AND created_at < datetime('now', '-90 days')`,
    );

    await tursoExecute(
      env,
      `DELETE FROM crash_logs WHERE deleted_at IS NOT NULL
       AND deleted_at < datetime('now', '-30 days')`,
    );
  },
};
