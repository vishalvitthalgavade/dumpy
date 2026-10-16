import { NextResponse } from "next/server";
import { trackPublicVisit } from "@/lib/analytics";

export async function POST(request: Request) {
  const { path } = (await request.json().catch(() => ({}))) as { path?: string };

  await trackPublicVisit(path?.slice(0, 300) || "/");

  return new NextResponse(null, { status: 204 });
}
