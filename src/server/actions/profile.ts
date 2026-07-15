"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { signOut } from "@/lib/auth";
import {
  avatarDataUrlSchema,
  updateProfileSchema,
} from "@/lib/validations/profile";

export type ProfileFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | null;

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const userId = await requireUserId();

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== userId) {
    return { errors: { email: ["Ya existe una cuenta con este email"] } };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name || null,
      email,
    },
  });

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function uploadAvatar(
  dataUrl: string
): Promise<{ error?: string }> {
  const userId = await requireUserId();

  const parsed = avatarDataUrlSchema.safeParse(dataUrl);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Imagen no válida" };
  }

  const [header, base64] = parsed.data.split(",", 2);
  const mimeType = header.slice("data:".length, header.indexOf(";"));
  const bytes = Buffer.from(base64, "base64");

  await prisma.user.update({
    where: { id: userId },
    data: {
      avatar: bytes,
      avatarMimeType: mimeType,
      avatarUpdatedAt: new Date(),
    },
  });

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return {};
}

export async function removeAvatar() {
  const userId = await requireUserId();

  await prisma.user.update({
    where: { id: userId },
    data: { avatar: null, avatarMimeType: null, avatarUpdatedAt: null },
  });

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
}

// La cuenta queda pausada (no se borra nada) y la sesión se cierra.
// Volver a iniciar sesión la reactiva automáticamente.
export async function suspendAccount() {
  const userId = await requireUserId();

  await prisma.user.update({
    where: { id: userId },
    data: { suspendedAt: new Date() },
  });

  await signOut({ redirectTo: "/login" });
}
