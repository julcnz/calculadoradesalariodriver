"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// Cierra una sesión concreta (nunca la actual desde aquí; para eso está
// "Cerrar sesión" del menú).
export async function closeSession(targetSessionId: string) {
  const { userId, sessionId } = await requireSession();
  if (targetSessionId === sessionId) return;

  await prisma.userSession.updateMany({
    where: { id: targetSessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  revalidatePath("/perfil");
}

// Cierra la sesión en todos los dispositivos menos este.
export async function closeOtherSessions() {
  const { userId, sessionId } = await requireSession();

  await prisma.userSession.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(sessionId ? { id: { not: sessionId } } : {}),
    },
    data: { revokedAt: new Date() },
  });

  revalidatePath("/perfil");
}
