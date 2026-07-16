"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireUserId } from "@/lib/session";
import { signOut } from "@/lib/auth";
import {
  avatarDataUrlSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "@/lib/validations/profile";
import { issueEmailVerification } from "@/lib/email-verification";
import { resolveOrigin } from "@/lib/origin";

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

  const current = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true },
  });
  const emailChanged = current.email !== email;

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name || null,
      email,
      // Un email nuevo debe verificarse de nuevo.
      ...(emailChanged ? { emailVerifiedAt: null } : {}),
    },
  });

  if (emailChanged) {
    await issueEmailVerification(userId, email, await resolveOrigin());
  }

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

export async function changePassword(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const { userId, sessionId } = await requireSession();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { passwordHash: true },
  });

  const currentMatches = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash
  );
  if (!currentMatches) {
    return {
      errors: { currentPassword: ["La contraseña actual no es correcta"] },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    }),
    // Seguridad: cambiar la contraseña cierra las sesiones de otros dispositivos.
    prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(sessionId ? { id: { not: sessionId } } : {}),
      },
      data: { revokedAt: new Date() },
    }),
  ]);

  revalidatePath("/perfil");
  return { success: true };
}

// La cuenta queda pausada (no se borra nada) y la sesión se cierra.
// Volver a iniciar sesión la reactiva automáticamente.
export async function suspendAccount() {
  const userId = await requireUserId();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { suspendedAt: new Date() },
    }),
    // Cierra la sesión en TODOS los dispositivos.
    prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await signOut({ redirectTo: "/login" });
}
