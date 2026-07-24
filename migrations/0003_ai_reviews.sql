CREATE TABLE ai_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  endpoint TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  api_key TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  updated_at TEXT NOT NULL
);

CREATE TABLE ai_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  report TEXT,
  files_inspected TEXT NOT NULL DEFAULT '[]',
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error TEXT
);

INSERT INTO ai_settings (id, endpoint, model, api_key, enabled, updated_at)
VALUES (1, '', '', '', 0, '2026-07-24T00:00:00.000Z');
