import { createHash, randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { queryDatabase } from "@/lib/db";

const SESSION_COOKIE = "dumpyard_visitor";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365;
const UNIQUE_WINDOW_MINUTES = 30;

export type AnalyticsSummary = {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  weekVisits: number;
  monthVisits: number;
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

  await queryDatabase(
    `INSERT INTO visitor_page_visits (visitor_id, path)
     VALUES ($1, $2)`,
    [visitorId, path]
  );
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const result = await queryDatabase<{
    total_visits: string;
    unique_visitors: string;
    today_visits: string;
    week_visits: string;
    month_visits: string;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM visitor_page_visits) AS total_visits,
       (SELECT COALESCE(SUM(unique_visit_count), 0) FROM visitor_identities) AS unique_visitors,
       (SELECT COUNT(*) FROM visitor_page_visits
        WHERE created_at >= date_trunc('day', NOW() AT TIME ZONE 'Asia/Kolkata')
          AT TIME ZONE 'Asia/Kolkata') AS today_visits,
       (SELECT COUNT(*) FROM visitor_page_visits
        WHERE created_at >= date_trunc('week', NOW() AT TIME ZONE 'Asia/Kolkata')
          AT TIME ZONE 'Asia/Kolkata') AS week_visits,
       (SELECT COUNT(*) FROM visitor_page_visits
        WHERE created_at >= date_trunc('month', NOW() AT TIME ZONE 'Asia/Kolkata')
          AT TIME ZONE 'Asia/Kolkata') AS month_visits`
  );

  const row = result.rows[0];

  return {
    totalVisits: Number(row?.total_visits ?? 0),
    uniqueVisitors: Number(row?.unique_visitors ?? 0),
    todayVisits: Number(row?.today_visits ?? 0),
    weekVisits: Number(row?.week_visits ?? 0),
    monthVisits: Number(row?.month_visits ?? 0)
  };
}
