import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const MAX_FILE_SIZE = 200 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => {
        await requireAdmin();
        return {
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_FILE_SIZE,
          validUntil: Date.now() + 15 * 60 * 1000
        };
      },
      onUploadCompleted: async () => {
        // The browser finalizes the uploaded object's metadata after the upload.
      }
    });
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload authorization failed.";
    const status = message.includes("Admin access") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
