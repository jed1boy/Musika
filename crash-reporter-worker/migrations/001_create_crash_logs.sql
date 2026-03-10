CREATE TABLE IF NOT EXISTS crash_logs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  occurred_at TEXT NOT NULL,
  app_version TEXT NOT NULL,
  package_name TEXT NOT NULL,
  version_code TEXT NOT NULL,
  android_version TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  architecture TEXT NOT NULL,
  thread_name TEXT NOT NULL,
  process_name TEXT NOT NULL,
  stack_trace TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  is_archived INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_crash_logs_created_at ON crash_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crash_logs_occurred_at ON crash_logs(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crash_logs_app_version ON crash_logs(app_version);
CREATE INDEX IF NOT EXISTS idx_crash_logs_package_name ON crash_logs(package_name);
CREATE INDEX IF NOT EXISTS idx_crash_logs_model ON crash_logs(model);
CREATE INDEX IF NOT EXISTS idx_crash_logs_fingerprint ON crash_logs(fingerprint);
