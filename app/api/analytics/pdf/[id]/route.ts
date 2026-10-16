import { NextResponse } from "next/server";
import { getContentAnalytics, getPdfAnalyticsPaths } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const analytics = await getContentAnalytics(getPdfAnalyticsPaths(id));

  return NextResponse.json(analytics, {
    headers: {
      "Cache-Control": "s-maxage=30, stale-while-revalidate=60"
    }
  });
}
