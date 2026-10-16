import { del, head } from "@vercel/blob";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createFile } from "@/lib/db";

const MAX_FILE_SIZE = 200 * 1024 * 1024;

function titleFromFileName(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json() as {
      url?: unknown;
      fileName?: unknown;
      title?: unknown;
    };
    const url = typeof body.url === "string" ? body.url : "";
    const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";

    let blobUrl: URL;
    try {
      blobUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "The uploaded file could not be verified." }, { status: 400 });
    }
    if (blobUrl.protocol !== "https:" || !blobUrl.hostname.endsWith(".public.blob.vercel-storage.com")) {
      return NextResponse.json({ error: "The uploaded file could not be verified." }, { status: 400 });
    }
    if (!fileName || fileName.length > 255 || /[\\/\u0000-\u001f]/.test(fileName)) {
      return NextResponse.json({ error: "Choose a file with a valid filename." }, { status: 400 });
    }

    const metadata = await head(url);
    if (metadata.size <= 0 || metadata.size > MAX_FILE_SIZE) {
      await del(url);
      return NextResponse.json({ error: "Files must be 200 MB or smaller." }, { status: 413 });
    }

    let id: string | undefined;
    try {
      id = await createFile({
        title: title || titleFromFileName(fileName),
        fileName,
        mimeType: metadata.contentType || "application/octet-stream",
        sizeBytes: metadata.size,
        blobUrl: url
      });
    } catch (error) {
      await del(url).catch((cleanupError) => console.error("[upload] orphan cleanup failed", cleanupError));
      throw error;
    }
    if (!id) throw new Error("The file metadata could not be saved.");

    revalidatePath("/");
    revalidatePath("/admin");
    return NextResponse.json({ id });
  } catch (error) {
    console.error("[upload] Could not finalize uploaded file", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save the uploaded file." },
      { status: 400 }
    );
  }
}
