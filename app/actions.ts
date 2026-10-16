"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import {
  clearAdminSession,
  createAdminSession,
  requireAdmin,
  verifyPassword
} from "@/lib/auth";
import {
  createTextEntry,
  deleteFile,
  deleteTextEntry,
  getFileMeta,
  updateFileTitle,
  updateTextEntry
} from "@/lib/db";

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
  const file = await getFileMeta(id);
  if (file?.blobUrl) await del(file.blobUrl);
  await deleteFile(id);

  revalidatePath("/");
  revalidatePath("/admin");
}
