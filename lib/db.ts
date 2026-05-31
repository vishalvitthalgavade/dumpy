import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var dumpyardPool: Pool | undefined;
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!global.dumpyardPool) {
    global.dumpyardPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost")
        ? false
        : { rejectUnauthorized: false }
    });
  }

  return global.dumpyardPool;
}

let schemaPromise: Promise<void> | null = null;

async function ensureSchema() {
  schemaPromise ??= getPool()
    .query(`
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

      INSERT INTO notes (id, content)
      VALUES (1, '')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO text_entries (title, content, created_at, updated_at)
      SELECT 'Saved Text', content, updated_at, updated_at
      FROM notes
      WHERE id = 1
        AND trim(content) <> ''
        AND NOT EXISTS (SELECT 1 FROM text_entries);
    `)
    .then(() => undefined);

  await schemaPromise;
}

export type PdfItem = {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type TextEntry = {
  id: string;
  title: string;
  content: string;
  contentPreview: string;
  characterCount: number;
  createdAt: string;
  updatedAt: string;
};

export async function getPdfs(): Promise<PdfItem[]> {
  await ensureSchema();

  const result = await getPool().query<{
    id: string;
    title: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    created_at: Date;
  }>(
    `SELECT id, title, file_name, mime_type, size_bytes, created_at
     FROM pdfs
     ORDER BY created_at DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at.toISOString()
  }));
}

export async function getPdfFile(id: string) {
  await ensureSchema();

  const result = await getPool().query<{
    title: string;
    file_name: string;
    mime_type: string;
    data: Buffer;
  }>(
    `SELECT title, file_name, mime_type, data
     FROM pdfs
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function createPdf(input: {
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  data: Buffer;
}) {
  await ensureSchema();

  await getPool().query(
    `INSERT INTO pdfs (title, file_name, mime_type, size_bytes, data)
     VALUES ($1, $2, $3, $4, $5)`,
    [input.title, input.fileName, input.mimeType, input.sizeBytes, input.data]
  );
}

export async function deletePdf(id: string) {
  await ensureSchema();

  await getPool().query("DELETE FROM pdfs WHERE id = $1", [id]);
}

export async function getTextEntries(): Promise<TextEntry[]> {
  await ensureSchema();

  const result = await getPool().query<{
    id: string;
    title: string;
    content: string;
    content_preview: string;
    character_count: number;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT id, title, content, left(content, 180) AS content_preview,
            char_length(content) AS character_count, created_at, updated_at
     FROM text_entries
     ORDER BY created_at DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    contentPreview: row.content_preview,
    characterCount: row.character_count,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  }));
}

export async function getTextEntry(id: string): Promise<TextEntry | null> {
  await ensureSchema();

  const result = await getPool().query<{
    id: string;
    title: string;
    content: string;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT id, title, content, created_at, updated_at
     FROM text_entries
     WHERE id = $1`,
    [id]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    contentPreview: row.content.slice(0, 180),
    characterCount: row.content.length,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function createTextEntry(input: {
  title: string;
  content: string;
}) {
  await ensureSchema();

  const result = await getPool().query<{ id: string }>(
    `INSERT INTO text_entries (title, content)
     VALUES ($1, $2)
     RETURNING id`,
    [input.title, input.content]
  );

  return result.rows[0].id;
}

export async function updateTextEntry(input: {
  id: string;
  title: string;
  content: string;
}) {
  await ensureSchema();

  await getPool().query(
    `UPDATE text_entries
     SET title = $2, content = $3, updated_at = NOW()
     WHERE id = $1`,
    [input.id, input.title, input.content]
  );
}

export async function deleteTextEntry(id: string) {
  await ensureSchema();

  await getPool().query("DELETE FROM text_entries WHERE id = $1", [id]);
}
