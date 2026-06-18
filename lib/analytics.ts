import { createHash, randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { queryDatabase } from "@/lib/db";

const SESSION_COOKIE = "dumpyard_visitor";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365;
const UNIQUE_WINDOW_MINUTES = 30;

export type AnalyticsSummary = {
  totalVisitors: number;
  todayVisitors: number;
  activeVisitors: number;
  uniqueContentViews: number;
  pageViews: number;
};

export type ContentAnalytics = {
  totalViews: number;
  uniqueViews: number;
  lastViewed: string | null;
};

export type TopContentAnalytics = ContentAnalytics & {
  id: string;
  title: string;
};

function hashValue(value: string) {
  const salt = process.env.AUTH_SECRET ?? "dumpyard-analytics";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

function getIpAddress(headerStore: Headers) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    headerStore.get("x-real-ip") ??
    headerStore.get("cf-connecting-ip") ??
    "unknown"
  );
}

async function getOrCreateSessionId() {
  const cookieStore = await cookies();
  const existingSession = cookieStore.get(SESSION_COOKIE)?.value;

  if (existingSession) {
    return existingSession;
  }

  const sessionId = randomUUID();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE
  });

  return sessionId;
}

export async function trackPublicVisit(path: string) {
  const headerStore = await headers();
  const sessionId = await getOrCreateSessionId();
  const userAgent = headerStore.get("user-agent") ?? "unknown";
  const ipAddress = getIpAddress(headerStore);

  const ipHash = hashValue(ipAddress);
  const userAgentHash = hashValue(userAgent);
  const visitorKey = hashValue(`${ipHash}:${userAgentHash}:${sessionId}`);

  const result = await queryDatabase<{ id: string }>(
    `INSERT INTO visitor_identities (
       visitor_key, ip_hash, user_agent_hash, session_id,
       first_seen_at, last_seen_at, last_unique_at, unique_visit_count
     )
     VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW(), 1)
     ON CONFLICT (visitor_key)
     DO UPDATE SET
       last_seen_at = NOW(),
       last_unique_at = CASE
         WHEN visitor_identities.last_unique_at < NOW() - ($5::interval)
         THEN NOW()
         ELSE visitor_identities.last_unique_at
       END,
       unique_visit_count = CASE
         WHEN visitor_identities.last_unique_at < NOW() - ($5::interval)
         THEN visitor_identities.unique_visit_count + 1
         ELSE visitor_identities.unique_visit_count
       END
     RETURNING id`,
    [
      visitorKey,
      ipHash,
      userAgentHash,
      sessionId,
      `${UNIQUE_WINDOW_MINUTES} minutes`
    ]
  );

  const visitorId = result.rows[0]?.id;
  if (!visitorId) {
    return;
  }

  const insertVisit = await queryDatabase<{ id: string }>(
    `INSERT INTO visitor_page_visits (visitor_id, path)
     SELECT $1, $2
     WHERE NOT EXISTS (
       SELECT 1
       FROM visitor_page_visits
       WHERE visitor_id = $1
         AND path = $2
         AND created_at > NOW() - ($3::interval)
     )
     RETURNING id`,
    [visitorId, path, `${UNIQUE_WINDOW_MINUTES} minutes`]
  );

  const duplicateDetected = insertVisit.rows.length === 0;
  console.log("[analytics]", {
    visitor_id: visitorId,
    path,
    created_at: new Date().toISOString(),
    duplicate_detected: duplicateDetected
  });

  return;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const result = await queryDatabase<{
    total_visitors: string;
    today_visitors: string;
    active_visitors: string;
    unique_content_views: string;
    page_views: string;
  }>(
    `SELECT
       (SELECT COUNT(DISTINCT visitor_id) FROM visitor_page_visits) AS total_visitors,
       (SELECT COUNT(DISTINCT visitor_id) FROM visitor_page_visits
        WHERE created_at >= CURRENT_DATE) AS today_visitors,
       (SELECT COUNT(DISTINCT visitor_id) FROM visitor_page_visits
        WHERE created_at >= NOW() - INTERVAL '5 minutes') AS active_visitors,
       (SELECT COUNT(*) FROM (
          SELECT DISTINCT visitor_id, path
          FROM visitor_page_visits
        ) unique_views) AS unique_content_views,
       (SELECT COUNT(*) FROM visitor_page_visits
       ) AS page_views`
  );

  const row = result.rows[0];

  return {
    totalVisitors: Number(row?.total_visitors ?? 0),
    todayVisitors: Number(row?.today_visitors ?? 0),
    activeVisitors: Number(row?.active_visitors ?? 0),
    uniqueContentViews: Number(row?.unique_content_views ?? 0),
    pageViews: Number(row?.page_views ?? 0)
  };
}

function emptyContentAnalytics(): ContentAnalytics {
  return {
    totalViews: 0,
    uniqueViews: 0,
    lastViewed: null
  };
}

function mapContentRow(row?: {
  total_views: string;
  unique_views: string;
  last_viewed: Date | null;
}): ContentAnalytics {
  if (!row) {
    return emptyContentAnalytics();
  }

  return {
    totalViews: Number(row.total_views ?? 0),
    uniqueViews: Number(row.unique_views ?? 0),
    lastViewed: row.last_viewed ? row.last_viewed.toISOString() : null
  };
}

export function getPdfAnalyticsPaths(id: string) {
  return [`/api/pdfs/${id}`, `/api/pdfs/${id}?download=1`];
}

export function getTextAnalyticsPaths(id: string) {
  return [`/texts/${id}`];
}

export async function getContentAnalytics(paths: string[]): Promise<ContentAnalytics> {
  if (paths.length === 0) {
    return emptyContentAnalytics();
  }

  const result = await queryDatabase<{
    total_views: string;
    unique_views: string;
    last_viewed: Date | null;
  }>(
    `SELECT
       COUNT(*) AS total_views,
       COUNT(DISTINCT visitor_id) AS unique_views,
       MAX(created_at) AS last_viewed
     FROM visitor_page_visits
     WHERE path = ANY($1::text[])`,
    [paths]
  );

  return mapContentRow(result.rows[0]);
}

export async function getPdfAnalyticsMap() {
  const result = await queryDatabase<{
    content_id: string;
    total_views: string;
    unique_views: string;
    last_viewed: Date | null;
  }>(
    `SELECT
       split_part(regexp_replace(path, '\\?.*$', ''), '/', 4) AS content_id,
       COUNT(*) AS total_views,
       COUNT(DISTINCT visitor_id) AS unique_views,
       MAX(created_at) AS last_viewed
     FROM visitor_page_visits
     WHERE path LIKE '/api/pdfs/%'
     GROUP BY content_id`
  );

  return Object.fromEntries(
    result.rows
      .filter((row) => row.content_id)
      .map((row) => [row.content_id, mapContentRow(row)])
  );
}

export async function getTextAnalyticsMap() {
  const result = await queryDatabase<{
    content_id: string;
    total_views: string;
    unique_views: string;
    last_viewed: Date | null;
  }>(
    `SELECT
       split_part(path, '/', 3) AS content_id,
       COUNT(*) AS total_views,
       COUNT(DISTINCT visitor_id) AS unique_views,
       MAX(created_at) AS last_viewed
     FROM visitor_page_visits
     WHERE path LIKE '/texts/%'
     GROUP BY content_id`
  );

  return Object.fromEntries(
    result.rows
      .filter((row) => row.content_id)
      .map((row) => [row.content_id, mapContentRow(row)])
  );
}

export async function getTopViewedPdfs(limit = 5): Promise<TopContentAnalytics[]> {
  const result = await queryDatabase<{
    id: string;
    title: string;
    total_views: string;
    unique_views: string;
    last_viewed: Date | null;
  }>(
    `SELECT
       p.id,
       p.title,
       COUNT(v.id) AS total_views,
       COUNT(DISTINCT v.visitor_id) AS unique_views,
       MAX(v.created_at) AS last_viewed
     FROM pdfs p
     LEFT JOIN visitor_page_visits v
       ON split_part(regexp_replace(v.path, '\\?.*$', ''), '/', 4) = p.id::text
      AND v.path LIKE '/api/pdfs/%'
     GROUP BY p.id, p.title
     ORDER BY total_views DESC, unique_views DESC, p.created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    ...mapContentRow(row)
  }));
}

export async function getTopViewedTexts(limit = 5): Promise<TopContentAnalytics[]> {
  const result = await queryDatabase<{
    id: string;
    title: string;
    total_views: string;
    unique_views: string;
    last_viewed: Date | null;
  }>(
    `SELECT
       t.id,
       t.title,
       COUNT(v.id) AS total_views,
       COUNT(DISTINCT v.visitor_id) AS unique_views,
       MAX(v.created_at) AS last_viewed
     FROM text_entries t
     LEFT JOIN visitor_page_visits v
       ON split_part(v.path, '/', 3) = t.id::text
      AND v.path LIKE '/texts/%'
     GROUP BY t.id, t.title
     ORDER BY total_views DESC, unique_views DESC, t.created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    ...mapContentRow(row)
  }));
}
