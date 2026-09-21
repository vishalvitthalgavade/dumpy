import { NextResponse } from "next/server";
import { getFile } from "@/lib/db";
import { trackPublicVisit } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = await getFile(id);
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";
  await trackPublicVisit(`/api/files/${id}${download ? "?download=1" : ""}`);

  return new NextResponse(file.data, {
    headers: {
      "Content-Type": file.mime_type || "application/octet-stream",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.file_name)}`,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
    }
  });
}
