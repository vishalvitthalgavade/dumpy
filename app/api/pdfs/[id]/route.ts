import { NextRequest, NextResponse } from "next/server";
import { getPdfFile } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pdf = await getPdfFile(id);

  if (!pdf) {
    return new NextResponse("PDF not found.", { status: 404 });
  }

  const disposition = request.nextUrl.searchParams.has("download")
    ? "attachment"
    : "inline";

  return new NextResponse(pdf.data, {
    headers: {
      "Content-Type": pdf.mime_type,
      "Content-Length": String(pdf.data.length),
      "Content-Disposition": `${disposition}; filename="${encodeURIComponent(
        pdf.file_name
      )}"`,
      "Cache-Control": "public, max-age=60"
    }
  });
}
