"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { issueEmailVerification } from "@/lib/email-verification";
import { resolveOrigin } from "@/lib/origin";
import { rateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";

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
