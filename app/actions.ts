"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  clearAdminSession,
  createAdminSession,
  requireAdmin,
  verifyPassword
} from "@/lib/auth";
import {
  createFile,
  createTextEntry,
  deleteFile,
  deleteTextEntry,
  updateFileTitle,
  updateTextEntry
} from "@/lib/db";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Strips a trailing extension for use as a default title, but leaves
// dotfiles like ".gitignore" alone instead of collapsing them to "".
function titleFromFileName(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!verifyPassword(password)) {
    redirect("/admin/login?error=1");
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/");
}

export async function uploadFileAction(formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  const title = String(formData.get("title") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a file to upload.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File uploads are limited to 10 MB.");
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "";
  const allowedExtensions = new Set([
    "pdf", "doc", "docx", "xls", "xlsx", "csv", "ppt", "pptx", "txt", "md", "rtf",
    "zip", "rar", "7z", "tar", "gz", "json", "xml", "html", "css", "js", "ts", "jsx", "tsx",
    "py", "java", "c", "cpp", "h", "hpp", "sql", "jpg", "jpeg", "png", "gif", "webp", "svg",
    "mp3", "wav", "mp4", "webm", "mov"
  ]);
  if (!extension || !allowedExtensions.has(extension)) {
    throw new Error("This file type is not supported.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  await createFile({
    title: title || titleFromFileName(file.name),
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    data: buffer
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createTextAction(formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!title || !content) {
    throw new Error("A headline and text are required.");
  }

  await createTextEntry({ title, content });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateTextAction(formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!id || !title || !content) {
    throw new Error("A headline and text are required.");
  }

  await updateTextEntry({ id, title, content });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/texts/${id}`);
  revalidatePath(`/admin/texts/${id}/edit`);
  redirect(`/admin/texts/${id}/edit?updated=1`);
}

export async function deleteTextAction(formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  const id = String(formData.get("id") ?? "");
  await deleteTextEntry(id);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateFileAction(formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  if (!id || !title) {
    throw new Error("A title is required.");
  }

  await updateFileTitle(id, title);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/files/${id}/edit`);
  redirect(`/admin/files/${id}/edit?updated=1`);
}

export async function deleteFileAction(formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  const id = String(formData.get("id") ?? "");
  await deleteFile(id);

  revalidatePath("/");
  revalidatePath("/admin");
}
