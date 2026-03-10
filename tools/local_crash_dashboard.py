import html
import json
import os
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer


HOST = os.getenv("CRASH_DASHBOARD_HOST", "127.0.0.1")
PORT = int(os.getenv("CRASH_DASHBOARD_PORT", "8788"))
PAGE_SIZE = int(os.getenv("CRASH_DASHBOARD_PAGE_SIZE", "50"))

TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL", "").rstrip("/")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN", "")


def turso_arg(value):
    if value is None:
        return {"type": "null"}
    if isinstance(value, bool):
        return {"type": "integer", "value": "1" if value else "0"}
    if isinstance(value, int):
        return {"type": "integer", "value": str(value)}
    if isinstance(value, float):
        return {"type": "float", "value": value}
    return {"type": "text", "value": str(value)}


def from_turso_value(value):
    if value is None:
        return None
    if not isinstance(value, dict) or "type" not in value:
        return value
    if value["type"] == "null":
        return None
    if value["type"] in ("integer", "float"):
        try:
            return int(value["value"]) if value["type"] == "integer" else float(value["value"])
        except Exception:
            return value.get("value")
    return value.get("value")


def turso_execute(sql, args=None):
    if not TURSO_DATABASE_URL or not TURSO_AUTH_TOKEN:
        raise RuntimeError("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN first.")

    payload = {
        "requests": [
            {
                "type": "execute",
                "stmt": {
                    "sql": sql,
                    "args": [turso_arg(a) for a in (args or [])],
                },
            }
        ]
    }
    req = urllib.request.Request(
        f"{TURSO_DATABASE_URL}/v2/pipeline",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {TURSO_AUTH_TOKEN}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as response:
        data = json.loads(response.read().decode("utf-8"))

    first = data.get("results", [{}])[0]
    if first.get("type") == "error":
        raise RuntimeError(json.dumps(first))

    result = first.get("response", {}).get("result", {})
    cols = result.get("cols", [])
    rows = result.get("rows", [])
    out = []
    for row in rows:
        item = {}
        for i, col in enumerate(cols):
            item[col.get("name")] = from_turso_value(row[i] if i < len(row) else None)
        out.append(item)
    return out


def page_template(title, body):
    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>{html.escape(title)}</title>
  <style>
    body {{ font-family: Inter, Arial, sans-serif; margin: 0; background: #0f1115; color: #e7e7e7; }}
    .container {{ max-width: 1100px; margin: 0 auto; padding: 20px; }}
    .card {{ background: #171a21; border: 1px solid #2a2f3b; border-radius: 12px; padding: 16px; margin-bottom: 16px; }}
    .input {{ border-radius: 8px; border: 1px solid #3a4355; background: #10131a; color: #e7e7e7; padding: 10px 12px; }}
    .button {{ border-radius: 8px; cursor: pointer; background: #2f6cf5; border: none; color: #fff; font-weight: 600; padding: 10px 12px; text-decoration: none; }}
    .muted {{ color: #a5afc2; font-size: 13px; }}
    table {{ width: 100%; border-collapse: collapse; }}
    th, td {{ text-align: left; border-bottom: 1px solid #2a2f3b; padding: 10px 8px; vertical-align: top; }}
    a {{ color: #8fb4ff; text-decoration: none; }}
    pre {{ white-space: pre-wrap; word-break: break-word; background: #0d1016; border: 1px solid #2a2f3b; padding: 12px; border-radius: 8px; }}
    .row {{ display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }}
    .grow {{ flex: 1; min-width: 200px; }}
  </style>
</head>
<body><div class="container">{body}</div></body>
</html>"""


class DashboardHandler(BaseHTTPRequestHandler):
    def _send_html(self, content, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(content.encode("utf-8"))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        params = urllib.parse.parse_qs(parsed.query)

        if path == "/" or path == "/logs":
            self.render_logs(params)
            return
        if path == "/log":
            self.render_log_detail(params)
            return
        self._send_html(page_template("Not Found", "<div class='card'>Not found.</div>"), 404)

    def render_logs(self, params):
        q = (params.get("q", [""])[0] or "").strip()
        app_version = (params.get("appVersion", [""])[0] or "").strip()
        device = (params.get("device", [""])[0] or "").strip()

        conditions = ["deleted_at IS NULL"]
        args = []
        if q:
            conditions.append("(stack_trace LIKE ? OR package_name LIKE ? OR fingerprint LIKE ?)")
            args.extend([f"%{q}%", f"%{q}%", f"%{q}%"])
        if app_version:
            conditions.append("app_version = ?")
            args.append(app_version)
        if device:
            conditions.append("(manufacturer LIKE ? OR model LIKE ?)")
            args.extend([f"%{device}%", f"%{device}%"])
        where_clause = " WHERE " + " AND ".join(conditions)

        logs = turso_execute(
            f"""SELECT id, created_at, app_version, manufacturer, model, substr(stack_trace,1,220) AS stack_preview
                FROM crash_logs{where_clause}
                ORDER BY created_at DESC
                LIMIT ?""",
            args + [PAGE_SIZE],
        )

        rows = "".join(
            f"<tr>"
            f"<td><a href='/log?id={urllib.parse.quote(str(r.get('id','')))}'>{html.escape(str(r.get('id','')))}</a></td>"
            f"<td>{html.escape(str(r.get('created_at','')))}</td>"
            f"<td>{html.escape(str(r.get('app_version','')))}</td>"
            f"<td>{html.escape(str(r.get('manufacturer','')))} {html.escape(str(r.get('model','')))}</td>"
            f"<td><span class='muted'>{html.escape(str(r.get('stack_preview','')))}</span></td>"
            f"</tr>"
            for r in logs
        ) or "<tr><td colspan='5'>No logs found.</td></tr>"

        body = f"""
        <div class='card'>
          <h2 style='margin-top:0;'>Local Crash Dashboard (Turso)</h2>
          <p class='muted'>Running locally on {html.escape(HOST)}:{PORT}. Showing latest {PAGE_SIZE} logs.</p>
          <form method='get' action='/logs' class='row'>
            <input class='input grow' type='text' name='q' value='{html.escape(q)}' placeholder='Search stack/package/fingerprint' />
            <input class='input' type='text' name='appVersion' value='{html.escape(app_version)}' placeholder='App version' />
            <input class='input' type='text' name='device' value='{html.escape(device)}' placeholder='Device' />
            <button class='button' type='submit'>Filter</button>
          </form>
          <table>
            <thead><tr><th>ID</th><th>Created</th><th>Version</th><th>Device</th><th>Stack Preview</th></tr></thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
        """
        self._send_html(page_template("Crash Logs", body))

    def render_log_detail(self, params):
        log_id = (params.get("id", [""])[0] or "").strip()
        if not log_id:
            self._send_html(page_template("Bad Request", "<div class='card'>Missing id query parameter.</div>"), 400)
            return

        rows = turso_execute(
            "SELECT * FROM crash_logs WHERE id = ? AND deleted_at IS NULL LIMIT 1",
            [log_id],
        )
        if not rows:
            self._send_html(page_template("Not Found", "<div class='card'>Log not found.</div>"), 404)
            return

        log = rows[0]
        body = f"""
        <div class='card'>
          <a class='button' href='/logs'>Back to logs</a>
          <h2>Crash {html.escape(str(log.get('id','')))}</h2>
          <p><strong>Created:</strong> {html.escape(str(log.get('created_at','')))}</p>
          <p><strong>Occurred:</strong> {html.escape(str(log.get('occurred_at','')))}</p>
          <p><strong>Package:</strong> {html.escape(str(log.get('package_name','')))}</p>
          <p><strong>Version:</strong> {html.escape(str(log.get('app_version','')))} ({html.escape(str(log.get('version_code','')))})</p>
          <p><strong>Device:</strong> {html.escape(str(log.get('manufacturer','')))} {html.escape(str(log.get('model','')))}</p>
          <h3>Stack Trace</h3>
          <pre>{html.escape(str(log.get('stack_trace','')))}</pre>
          <h3>Raw Payload</h3>
          <pre>{html.escape(str(log.get('payload_json','')))}</pre>
        </div>
        """
        self._send_html(page_template("Crash Detail", body))


def main():
    if not TURSO_DATABASE_URL or not TURSO_AUTH_TOKEN:
        print("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before starting.")
        return
    server = HTTPServer((HOST, PORT), DashboardHandler)
    print(f"Local dashboard: http://{HOST}:{PORT}/logs")
    server.serve_forever()


if __name__ == "__main__":
    main()
