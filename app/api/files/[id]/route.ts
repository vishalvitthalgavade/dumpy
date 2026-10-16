import { NextResponse } from "next/server";
import { getFile } from "@/lib/db";
import { trackPublicVisit } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const INLINE_TYPES = new Set([
  "application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp",
  "audio/mpeg", "audio/wav", "audio/ogg", "video/mp4", "video/webm", "text/plain"
]);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = await getFile(id);
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";
  const disposition = !download && INLINE_TYPES.has(file.mime_type)
    ? "inline"
    : "attachment";
  // Analytics must never prevent a public file from being served.
  if (!request.headers.has("range")) {
    try {
      await trackPublicVisit(`/api/files/${id}${download ? "?download=1" : ""}`);
    } catch (error) {
      console.error("[analytics] file view tracking failed", error);
    }
  }

  if (file.blob_url) {
    if (download || !INLINE_TYPES.has(file.mime_type)) {
      return NextResponse.redirect(file.blob_url, 302);
    }

    // Stream media from Blob with byte ranges so PDF/video viewers can seek
    // without loading the entire file into the function or database.
    const range = request.headers.get("range");
    const ifRange = request.headers.get("if-range");
    const upstream = await fetch(file.blob_url, {
      headers: {
        ...(range ? { range } : {}),
        ...(ifRange ? { "if-range": ifRange } : {})
      }
    });
    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json({ error: "File could not be opened." }, { status: upstream.status });
    }
    const headers = new Headers({
      "Content-Type": file.mime_type,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.file_name)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
    });
    for (const name of ["content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new NextResponse(upstream.body, { status: upstream.status, headers });
  }

  if (!file.data) return NextResponse.json({ error: "File not found" }, { status: 404 });

  return new NextResponse(file.data, {
    headers: {
      "Content-Type": file.mime_type || "application/octet-stream",
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(file.file_name)}`,
      "Cache-Control": "no-store"
    }
  });
}
