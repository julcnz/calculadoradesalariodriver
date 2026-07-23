import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  addDays,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  isPeriodType,
  toDateParam,
  todayInTimeZone,
  type PeriodType,
} from "@/lib/dates/week";
import { formatPeriodRange } from "@/lib/format";

// Resumen público de un período (/s/[token]). Datos en vivo del período
// fijo guardado; SIN gastos ni neto (decisión de privacidad). Compartido
// entre la página y su opengraph-image para no duplicar cálculo.

export function hashShareToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Fin del período a partir de su inicio (ya alineado). No necesita
// weekStartDay: el inicio guardado ya es la frontera del período.
function periodEnd(periodType: PeriodType, start: Date): Date {
  switch (periodType) {
    case "dia":
      return start;
    case "semana":
      return addDays(start, 6);
    case "mes":
      return endOfMonth(start);
    case "trimestre":
      return endOfQuarter(start);
    case "ano":
      return endOfYear(start);
  }
}

export type SharedWeekSummary = {
  ownerName: string | null;
  periodType: PeriodType;
  periodStart: Date;
  periodEnd: Date;
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
      periodType: true,
      weekStart: true,
      revokedAt: true,
      user: { select: { id: true, name: true, timeZone: true } },
    },
  });
  if (!shared || shared.revokedAt) return null;

  const periodType: PeriodType = isPeriodType(shared.periodType)
    ? shared.periodType
    : "semana";
  const periodStart = shared.weekStart;
  const periodEndDate = periodEnd(periodType, periodStart);

  const [weekLogs, historyDates] = await Promise.all([
    prisma.workLog.findMany({
      where: {
        userId: shared.user.id,
        date: { gte: periodStart, lte: periodEndDate },
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
    periodType,
    periodStart,
    periodEnd: periodEndDate,
    incomeCents,
    packages,
    daysWorked,
    perHourCents,
    streak,
  };
}

// Textos del período para la página pública y la OG (misma copia en ambas).
// `kind`: encabezado ("Resumen semanal"). `ownerKind`: variante con dueño
// ("La semana de X"). `incomeLabel`: rótulo de la cifra de ingresos.
export function describeSharedPeriod(periodType: PeriodType): {
  kind: string;
  ownerKind: (name: string) => string;
  incomeLabel: string;
} {
  switch (periodType) {
    case "dia":
      return {
        kind: "Resumen del día",
        ownerKind: (name) => `El día de ${name}`,
        incomeLabel: "Ingresos del día",
      };
    case "mes":
      return {
        kind: "Resumen mensual",
        ownerKind: (name) => `El mes de ${name}`,
        incomeLabel: "Ingresos del mes",
      };
    case "trimestre":
      return {
        kind: "Resumen trimestral",
        ownerKind: (name) => `El trimestre de ${name}`,
        incomeLabel: "Ingresos del trimestre",
      };
    case "ano":
      return {
        kind: "Resumen anual",
        ownerKind: (name) => `El año de ${name}`,
        incomeLabel: "Ingresos del año",
      };
    case "semana":
      return {
        kind: "Resumen semanal",
        ownerKind: (name) => `La semana de ${name}`,
        incomeLabel: "Ingresos de la semana",
      };
  }
}

// Rango legible de un período compartido (delega en formatPeriodRange).
export function formatSharedPeriodRange(summary: SharedWeekSummary): string {
  return formatPeriodRange(
    summary.periodType,
    summary.periodStart,
    summary.periodEnd
  );
}

// Etiqueta de un enlace compartido para la lista de Ajustes, p. ej.
// "Resumen semanal: 20 jul 2026 – 26 jul 2026". Recibe el tipo crudo de BD.
export function sharedPeriodLabel(periodTypeRaw: string, start: Date): string {
  const periodType: PeriodType = isPeriodType(periodTypeRaw)
    ? periodTypeRaw
    : "semana";
  const end = periodEnd(periodType, start);
  return `${describeSharedPeriod(periodType).kind}: ${formatPeriodRange(periodType, start, end)}`;
}
