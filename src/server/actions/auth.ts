"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { clientIp, rateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { issueEmailVerification } from "@/lib/email-verification";
import { resolveOrigin } from "@/lib/origin";

export async function logoutUser() {
  await signOut({ redirectTo: "/login" });
}

export type AuthFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | null;

export async function registerUser(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!rateLimit(`register:${await clientIp()}`, 5, 60 * 60 * 1000)) {
    return { message: RATE_LIMIT_MESSAGE };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["Ya existe una cuenta con este email"] } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: parsed.data.name || null,
    },
  });

  // Correo de verificación (no bloquea el registro si falla el envío).
  await issueEmailVerification(user.id, email, await resolveOrigin());

  // Inicia sesión automáticamente tras el registro.
  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirectTo: "/dashboard",
  });
  return null;
}

export async function loginUser(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!rateLimit(`login:${await clientIp()}`, 10, 15 * 60 * 1000)) {
    return { message: RATE_LIMIT_MESSAGE };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Email o contraseña incorrectos" };
    }
    // NEXT_REDIRECT y otros errores del framework deben propagarse.
    throw error;
  }
}
