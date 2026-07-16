"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  requestResetSchema,
  resetPasswordSchema,
} from "@/lib/validations/password-reset";
import { clientIp, rateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";

export type ResetFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | null;

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function resolveOrigin(): Promise<string> {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function requestPasswordReset(
  _prevState: ResetFormState,
  formData: FormData
): Promise<ResetFormState> {
  if (!rateLimit(`reset:${await clientIp()}`, 5, 60 * 60 * 1000)) {
    return { message: RATE_LIMIT_MESSAGE };
  }

  const parsed = requestResetSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Respuesta idéntica exista o no la cuenta: no revelamos qué emails
  // están registrados.
  if (user) {
    const token = randomBytes(32).toString("base64url");
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      }),
    ]);

    const origin = await resolveOrigin();
    await sendPasswordResetEmail(email, `${origin}/restablecer/${token}`);
  }

  return { success: true };
}

export async function resetPassword(
  _prevState: ResetFormState,
  formData: FormData
): Promise<ResetFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
  });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return {
      message:
        "El enlace no es válido o ya expiró. Solicita uno nuevo desde “¿Olvidaste tu contraseña?”.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    // Seguridad: restablecer la contraseña cierra TODAS las sesiones.
    prisma.userSession.updateMany({
      where: { userId: resetToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  redirect("/login?restablecida=1");
}
