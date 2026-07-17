// Métricas históricas compartidas (dashboard, punto de equilibrio, simulador).
// Aritmética en enteros: centavos y décimas de milla. Regla 2: cada promedio
// usa solo los registros que SÍ tienen ese dato (null jamás cuenta como 0).
import { toDateParam } from "@/lib/dates/week";

export type HistoryLogLite = {
  date: Date;
  totalEarnedCents: number;
  workedMinutes: number | null;
  packages: number;
  milesTenths: number | null;
};

export type HistoricalAverages = {
  perHourCents: number | null;
  perPackageCents: number | null;
};

export function computeAverages(logs: HistoryLogLite[]): HistoricalAverages {
  let minutes = 0;
  let centsWithMinutes = 0;
  let packages = 0;
  let centsWithPackages = 0;

  for (const log of logs) {
    if (log.workedMinutes !== null) {
      minutes += log.workedMinutes;
      centsWithMinutes += log.totalEarnedCents;
    }
    if (log.packages > 0) {
      packages += log.packages;
      centsWithPackages += log.totalEarnedCents;
    }
  }

  return {
    perHourCents:
      minutes > 0 ? Math.round(centsWithMinutes / (minutes / 60)) : null,
    perPackageCents:
      packages > 0 ? Math.round(centsWithPackages / packages) : null,
  };
}

export type WeekdayPerformance = {
  weekday: number; // 0=Domingo … 6=Sábado (getUTCDay)
  daysWorked: number;
  avgDayCents: number | null;
  perHourCents: number | null;
  perPackageCents: number | null;
};

export function computeWeekdayPerformance(
  logs: HistoryLogLite[]
): WeekdayPerformance[] {
  return Array.from({ length: 7 }, (_, weekday) => {
    const dayLogs = logs.filter((log) => log.date.getUTCDay() === weekday);
    // Varios registros del mismo día cuentan como UN día trabajado.
    const distinctDates = new Set(dayLogs.map((log) => toDateParam(log.date)));
    const totalCents = dayLogs.reduce(
      (acc, log) => acc + log.totalEarnedCents,
      0
    );
    const { perHourCents, perPackageCents } = computeAverages(dayLogs);

    return {
      weekday,
      daysWorked: distinctDates.size,
      avgDayCents:
        distinctDates.size > 0
          ? Math.round(totalCents / distinctDates.size)
          : null,
      perHourCents,
      perPackageCents,
    };
  });
}

// Promedio de millas (en décimas) por día trabajado, solo con registros que
// tienen millas. Null si nadie registró millas.
export function computeAvgMilesTenthsPerDay(
  logs: HistoryLogLite[]
): number | null {
  const withMiles = logs.filter((log) => log.milesTenths !== null);
  if (withMiles.length === 0) return null;
  const distinctDates = new Set(withMiles.map((log) => toDateParam(log.date)));
  const totalTenths = withMiles.reduce(
    (acc, log) => acc + (log.milesTenths ?? 0),
    0
  );
  return Math.round(totalTenths / distinctDates.size);
}
