"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { rateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { resolveOrigin } from "@/lib/origin";
import { startOfWeek } from "@/lib/dates/week";
import { hashShareToken } from "@/lib/shared-week";

export type CreateSharedWeekResult = { url: string } | { error: string };

// Crea (o rota) el enlace público de una semana. El token en claro solo
// existe en la URL devuelta; en BD queda su sha256. Un enlace activo por
// semana: recrear invalida el anterior.
export async function createSharedWeekLink(
  weekStartParam: string
): Promise<CreateSharedWeekResult> {
  const userId = await requireUserId();

  if (!rateLimit(`share:${userId}`, 10, 60 * 60 * 1000)) {
    return { error: RATE_LIMIT_MESSAGE };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStartParam)) {
    return { error: "Semana inválida" };
  }

  const { weekStartDay } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { weekStartDay: true },
  });
  // Normalizar SIEMPRE en el server: jamás confiar en la fecha del cliente.
  const weekStart = startOfWeek(new Date(weekStartParam), weekStartDay);

  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.sharedWeek.deleteMany({ where: { userId, weekStart } }),
    prisma.sharedWeek.create({
      data: { userId, weekStart, tokenHash: hashShareToken(token) },
    }),
  ]);

  revalidatePath("/configuracion");
  return { url: `${await resolveOrigin()}/s/${token}` };
}

export async function revokeSharedWeek(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.sharedWeek.updateMany({
    where: { id, userId },
    data: { revokedAt: new Date() },
  });
  revalidatePath("/configuracion");
}
