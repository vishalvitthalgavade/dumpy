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
  createPdf,
  createTextEntry,
  deletePdf,
  deleteTextEntry,
  updateTextEntry
} from "@/lib/db";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

export async function uploadPdfAction(formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  const title = String(formData.get("title") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a PDF to upload.");
  }

  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are allowed.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("PDF uploads are limited to 10 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  await createPdf({
    title: title || file.name.replace(/\.pdf$/i, ""),
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

  const id = await createTextEntry({ title, content });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/texts/${id}`);
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

export async function deletePdfAction(formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  const id = String(formData.get("id") ?? "");
  await deletePdf(id);

  revalidatePath("/");
  revalidatePath("/admin");
}
