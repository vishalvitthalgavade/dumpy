# Dumpyard

Dumpyard is a public file and note shelf with one admin account for uploading, editing, and deleting content.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and set:

   - `DATABASE_URL`
   - `ADMIN_PASSWORD`
   - `AUTH_SECRET`
   - `BLOB_READ_WRITE_TOKEN` (connect a Vercel Blob store for file uploads)

3. Create the database tables:

   ```bash
   npm run db:migrate
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

## Vercel deployment

Connect a Vercel Blob store to the project so Vercel provisions `BLOB_READ_WRITE_TOKEN`. Add `DATABASE_URL`, `ADMIN_PASSWORD`, and `AUTH_SECRET` in Vercel Project Settings, then run `npm run db:migrate` once against the production database from your machine.

Files upload directly from the browser to Vercel Blob using multipart transfer, so uploads do not pass through the Vercel Function request-size limit. The app accepts files up to 200 MB, shows upload progress, and stores file metadata and Blob URLs in PostgreSQL. Existing files stored in PostgreSQL remain available.
