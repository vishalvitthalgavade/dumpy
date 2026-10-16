# Dumpyard

Dumpyard is a public read-only PDF and note shelf with one admin account for uploading, editing, and deleting content.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and set:

   - `DATABASE_URL`
   - `ADMIN_PASSWORD`
   - `AUTH_SECRET`

3. Create the database tables:

   ```bash
   npm run db:migrate
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

## Vercel deployment

Add the same environment variables in Vercel Project Settings, then run `npm run db:migrate` once against the production database from your machine.

PDFs are stored in PostgreSQL as `bytea` so they stay available across Vercel deployments. Keep uploads modest in size; for large files, use Vercel Blob/S3 and store only URLs in PostgreSQL.
