import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost")
    ? false
    : { rejectUnauthorized: false }
});

// NOTE: this must stay in sync with the schema created lazily by
// lib/db.ts (ensureSchema). Running this script is optional in
// development -- the app creates the same tables on first request --
// but it lets you provision a fresh production database up front.
await pool.query(`
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  CREATE TABLE IF NOT EXISTS pdfs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/pdf',
    size_bytes INTEGER NOT NULL,
    data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS stored_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    size_bytes INTEGER NOT NULL,
    data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS stored_files_created_at_idx
    ON stored_files (created_at);

  INSERT INTO stored_files (id, title, file_name, mime_type, size_bytes, data, created_at)
  SELECT id, title, file_name, mime_type, size_bytes, data, created_at
  FROM pdfs
  ON CONFLICT (id) DO NOTHING;

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY DEFAULT 1,
    content TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT one_note CHECK (id = 1)
  );

  CREATE TABLE IF NOT EXISTS text_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS visitor_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_key TEXT NOT NULL UNIQUE,
    ip_hash TEXT NOT NULL,
    user_agent_hash TEXT NOT NULL,
    session_id TEXT NOT NULL,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_unique_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unique_visit_count INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS visitor_page_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID NOT NULL REFERENCES visitor_identities(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS visitor_page_visits_created_at_idx
    ON visitor_page_visits (created_at);

  CREATE INDEX IF NOT EXISTS visitor_page_visits_visitor_id_idx
    ON visitor_page_visits (visitor_id);

  CREATE INDEX IF NOT EXISTS visitor_page_visits_path_idx
    ON visitor_page_visits (path);

  CREATE INDEX IF NOT EXISTS idx_visits_visitor_path
    ON visitor_page_visits (visitor_id, path);

  CREATE INDEX IF NOT EXISTS idx_visits_created_at
    ON visitor_page_visits (created_at);

  CREATE INDEX IF NOT EXISTS visitor_page_visits_visitor_created_at_idx
    ON visitor_page_visits (visitor_id, created_at);

  INSERT INTO notes (id, content)
  VALUES (1, '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO text_entries (title, content, created_at, updated_at)
  SELECT 'Saved Text', content, updated_at, updated_at
  FROM notes
  WHERE id = 1
    AND trim(content) <> ''
    AND NOT EXISTS (SELECT 1 FROM text_entries);
`);

await pool.end();
console.log("Dumpyard database is ready.");
