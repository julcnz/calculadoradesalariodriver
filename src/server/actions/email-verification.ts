"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import {
  hashVerificationToken,
  issueEmailVerification,
} from "@/lib/email-verification";
import { resolveOrigin } from "@/lib/origin";
import { rateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";

// Consume el token y marca el email como verificado. Se llama desde el
// BOTÓN de /verificar/[token] — nunca al cargar la página, para que los
// escáneres de los clientes de correo no gasten el token de un solo uso.
export async function confirmEmailVerification(
  token: string
): Promise<{ ok: boolean }> {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashVerificationToken(token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true };
}

export async function resendVerificationEmail(): Promise<{
  sent?: boolean;
  error?: string;
}> {
  const userId = await requireUserId();

  if (!rateLimit(`verify:${userId}`, 3, 60 * 60 * 1000)) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerifiedAt: true },
  });
  if (!user) return { error: "Usuario no encontrado" };
  if (user.emailVerifiedAt) return { sent: true };

  await issueEmailVerification(user.id, user.email, await resolveOrigin());
  return { sent: true };
}
