"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { rateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { resolveOrigin } from "@/lib/origin";
import { getPeriodRange, isPeriodType } from "@/lib/dates/week";
import { hashShareToken } from "@/lib/shared-week";

export type CreateSharedWeekResult = { url: string } | { error: string };

// Crea (o rota) el enlace público de un período (día/semana/mes/trimestre/
// año). El token en claro solo existe en la URL devuelta; en BD queda su
// sha256. Un enlace activo por período (tipo + inicio): recrear invalida el
// anterior. Recibe el tipo y una fecha de referencia dentro del período; el
// inicio se normaliza en el server (jamás confiar en la fecha del cliente).
export async function createSharedWeekLink(
  periodTypeParam: string,
  fechaParam: string
): Promise<CreateSharedWeekResult> {
  const userId = await requireUserId();

  if (!rateLimit(`share:${userId}`, 10, 60 * 60 * 1000)) {
    return { error: RATE_LIMIT_MESSAGE };
  }
  if (!isPeriodType(periodTypeParam)) {
    return { error: "Período inválido" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaParam)) {
    return { error: "Fecha inválida" };
  }

  const { weekStartDay } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { weekStartDay: true },
  });
  const periodType = periodTypeParam;
  const { start: weekStart } = getPeriodRange(
    periodType,
    new Date(fechaParam),
    weekStartDay
  );

  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.sharedWeek.deleteMany({ where: { userId, periodType, weekStart } }),
    prisma.sharedWeek.create({
      data: { userId, periodType, weekStart, tokenHash: hashShareToken(token) },
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
