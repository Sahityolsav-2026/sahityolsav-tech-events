ALTER TABLE submissions ADD COLUMN repository_id INTEGER;
ALTER TABLE submissions ADD COLUMN repository_full_name TEXT;
ALTER TABLE submissions ADD COLUMN repository_verified_at TEXT;
ALTER TABLE submissions ADD COLUMN fork_url TEXT;
ALTER TABLE submissions ADD COLUMN fork_status TEXT NOT NULL DEFAULT 'not_started'
  CHECK (fork_status IN ('not_started', 'pending', 'archived', 'failed'));
ALTER TABLE submissions ADD COLUMN forked_at TEXT;
ALTER TABLE submissions ADD COLUMN fork_error TEXT;
