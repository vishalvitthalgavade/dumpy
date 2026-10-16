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
  const safeInlineTypes = new Set([
    "application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp",
    "audio/mpeg", "audio/wav", "audio/ogg", "video/mp4", "video/webm"
  ]);
  const disposition = !download && safeInlineTypes.has(file.mime_type)
    ? "inline"
    : "attachment";
  // Analytics must never prevent a public file from being served.
  try {
    await trackPublicVisit(`/api/files/${id}${download ? "?download=1" : ""}`);
  } catch (error) {
    console.error("[analytics] file view tracking failed", error);
  }

  return new NextResponse(file.data, {
    headers: {
      "Content-Type": file.mime_type || "application/octet-stream",
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(file.file_name)}`,
      "Cache-Control": "no-store"
    }
  });
}
