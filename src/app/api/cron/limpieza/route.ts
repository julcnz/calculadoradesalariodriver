import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SUSPENSION_GRACE_MS } from "@/lib/auth";

// Limpieza diaria (Vercel Cron la invoca con Authorization: Bearer CRON_SECRET):
// - elimina cuentas suspendidas hace más de 90 días (con todos sus datos)
// - purga tokens vencidos y sesiones viejas
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new NextResponse(null, { status: 401 });
  }

  const now = new Date();
  const suspensionCutoff = new Date(Date.now() - SUSPENSION_GRACE_MS);

  const [users, sessions, resetTokens, verificationTokens] =
    await prisma.$transaction([
      prisma.user.deleteMany({
        where: { suspendedAt: { lt: suspensionCutoff } },
      }),
      prisma.userSession.deleteMany({
        where: {
          OR: [
            { revokedAt: { lt: suspensionCutoff } },
            { lastActiveAt: { lt: suspensionCutoff } },
          ],
        },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
      prisma.emailVerificationToken.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
      // Enlaces de resumen compartido revocados hace más de 90 días.
      prisma.sharedWeek.deleteMany({
        where: { revokedAt: { lt: suspensionCutoff } },
      }),
    ]);

  return NextResponse.json({
    cuentasEliminadas: users.count,
    sesionesPurgadas: sessions.count,
    tokensPurgados: resetTokens.count + verificationTokens.count,
  });
}
