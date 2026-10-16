import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  const summary = await getAnalyticsSummary();

  return NextResponse.json(summary, {
    headers: {
      "Cache-Control": "s-maxage=30, stale-while-revalidate=60"
    }
  });
}
