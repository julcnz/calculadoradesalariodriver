import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

export function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Genera un token de verificación (invalida los anteriores) y envía el correo.
// No lanza: si el envío falla, el registro/edición no debe romperse.
export async function issueEmailVerification(
  userId: string,
  email: string,
  origin: string
): Promise<void> {
  try {
    const token = randomBytes(32).toString("base64url");
    await prisma.$transaction([
      prisma.emailVerificationToken.deleteMany({ where: { userId } }),
      prisma.emailVerificationToken.create({
        data: {
          userId,
          tokenHash: hashVerificationToken(token),
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      }),
    ]);
    await sendVerificationEmail(email, `${origin}/verificar/${token}`);
  } catch (error) {
    console.error("No se pudo enviar el correo de verificación:", error);
  }
}
