PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'team' CHECK (role IN ('team', 'admin')),
  created_at TEXT NOT NULL
);

CREATE TABLE teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  members TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  problem TEXT NOT NULL,
  target_users TEXT NOT NULL,
  importance TEXT NOT NULL,
  solution TEXT NOT NULL,
  user_journey TEXT NOT NULL,
  mvp_features TEXT NOT NULL,
  tech_stack TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  description TEXT NOT NULL,
  repository_url TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  application_type TEXT NOT NULL CHECK (application_type IN ('Web', 'Mobile')),
  application_url TEXT NOT NULL,
  test_instructions TEXT NOT NULL,
  ai_tools TEXT NOT NULL,
  preexisting_assets TEXT NOT NULL,
  member_contributions TEXT NOT NULL,
  limitations TEXT NOT NULL,
  confirmed INTEGER NOT NULL CHECK (confirmed = 1),
  submitted_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE event_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  event_name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  registration_deadline TEXT NOT NULL,
  idea_deadline TEXT NOT NULL,
  development_deadline TEXT NOT NULL,
  submission_deadline TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

INSERT INTO event_settings (
  id, event_name, timezone, registration_deadline, idea_deadline,
  development_deadline, submission_deadline, updated_at
) VALUES (
  1,
  'Sahityolsav Tech Events',
  'Asia/Kolkata',
  '2027-01-15T03:30:00.000Z',
  '2027-01-15T06:30:00.000Z',
  '2027-01-15T12:30:00.000Z',
  '2027-01-15T14:30:00.000Z',
  '2026-07-24T00:00:00.000Z'
);
