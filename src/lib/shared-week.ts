import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { addDays, toDateParam, todayInTimeZone } from "@/lib/dates/week";

// Resumen semanal público (/s/[token]). Datos en vivo de la semana fija
// guardada; SIN gastos ni neto (decisión de privacidad). Compartido entre
// la página y su opengraph-image para no duplicar cálculo.

export function hashShareToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SharedWeekSummary = {
  ownerName: string | null;
  weekStart: Date;
  weekEnd: Date;
  incomeCents: number;
  packages: number;
  daysWorked: number;
  perHourCents: number | null;
  streak: number;
};

export async function loadSharedWeekSummary(
  token: string
): Promise<SharedWeekSummary | null> {
  if (!token || token.length > 128) return null;

  const shared = await prisma.sharedWeek.findUnique({
    where: { tokenHash: hashShareToken(token) },
    select: {
      weekStart: true,
      revokedAt: true,
      user: { select: { id: true, name: true, timeZone: true } },
    },
  });
  if (!shared || shared.revokedAt) return null;

  const weekStart = shared.weekStart;
  const weekEnd = addDays(weekStart, 6);

  const [weekLogs, historyDates] = await Promise.all([
    prisma.workLog.findMany({
      where: {
        userId: shared.user.id,
        date: { gte: weekStart, lte: weekEnd },
      },
      select: {
        totalEarned: true,
        workedMinutes: true,
        date: true,
        entries: { select: { quantity: true } },
      },
    }),
    prisma.workLog.findMany({
      where: { userId: shared.user.id },
      select: { date: true },
    }),
  ]);

  const incomeCents = weekLogs.reduce(
    (acc, log) => acc + Math.round(Number(log.totalEarned) * 100),
    0
  );
  const packages = weekLogs.reduce(
    (acc, log) =>
      acc + log.entries.reduce((sum, entry) => sum + entry.quantity, 0),
    0
  );
  const daysWorked = new Set(weekLogs.map((log) => toDateParam(log.date))).size;

  // Regla 2: $/h solo con registros que tienen horas.
  const logsWithMinutes = weekLogs.filter((log) => log.workedMinutes !== null);
  const totalMinutes = logsWithMinutes.reduce(
    (acc, log) => acc + (log.workedMinutes ?? 0),
    0
  );
  const incomeCentsWithMinutes = logsWithMinutes.reduce(
    (acc, log) => acc + Math.round(Number(log.totalEarned) * 100),
    0
  );
  const perHourCents =
    totalMinutes > 0
      ? Math.round(incomeCentsWithMinutes / (totalMinutes / 60))
      : null;

  // Racha con el "hoy" del DUEÑO (tz persistida; sin cookie aquí).
  const workedDates = new Set(historyDates.map((log) => toDateParam(log.date)));
  const today = todayInTimeZone(shared.user.timeZone ?? undefined);
  let streak = 0;
  let cursor = workedDates.has(toDateParam(today)) ? today : addDays(today, -1);
  while (workedDates.has(toDateParam(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return {
    ownerName: shared.user.name,
    weekStart,
    weekEnd,
    incomeCents,
    packages,
    daysWorked,
    perHourCents,
    streak,
  };
}
