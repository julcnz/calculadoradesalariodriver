// Regla 4: la semana de pago es personalizada — el usuario elige el día en que
// comienza (User.weekStartDay: 0=domingo … 6=sábado). TODOS los cálculos
// semanales deben usar estas utilidades.
//
// Las fechas de negocio se guardan como fecha pura (@db.Date → medianoche UTC),
// por eso aquí se opera siempre en UTC.

export const WEEKDAYS_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

// "Hoy" del usuario convertido a fecha de negocio (medianoche UTC).
// OJO: sin zona horaria usa la del proceso (en Vercel, UTC). En código de
// servidor usar todayForUser() de src/lib/dates/server.ts, que lee la zona
// del navegador desde la cookie `tz`.
export function todayAsBusinessDate(): Date {
  return new Date(new Date().toLocaleDateString("en-CA"));
}

export function todayInTimeZone(timeZone?: string): Date {
  try {
    return new Date(new Date().toLocaleDateString("en-CA", { timeZone }));
  } catch {
    // Zona inválida en la cookie → caemos a la del servidor.
    return todayAsBusinessDate();
  }
}

export function startOfWeek(date: Date, weekStartDay: number): Date {
  const diff = (date.getUTCDay() - weekStartDay + 7) % 7;
  return addDays(date, -diff);
}

export function endOfWeek(date: Date, weekStartDay: number): Date {
  return addDays(startOfWeek(date, weekStartDay), 6);
}

export function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

// ----- Períodos del dashboard (día/semana/mes/trimestre/año) -----

export const PERIOD_TYPES = [
  "dia",
  "semana",
  "mes",
  "trimestre",
  "ano",
] as const;

export type PeriodType = (typeof PERIOD_TYPES)[number];

export function isPeriodType(value: string): value is PeriodType {
  return (PERIOD_TYPES as readonly string[]).includes(value);
}

export function startOfQuarter(date: Date): Date {
  const quarterMonth = Math.floor(date.getUTCMonth() / 3) * 3;
  return new Date(Date.UTC(date.getUTCFullYear(), quarterMonth, 1));
}

export function endOfQuarter(date: Date): Date {
  const quarterMonth = Math.floor(date.getUTCMonth() / 3) * 3;
  return new Date(Date.UTC(date.getUTCFullYear(), quarterMonth + 3, 0));
}

export function startOfYear(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

export function endOfYear(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 11, 31));
}

// Rango [inicio, fin] del período que contiene a `date`.
// La semana respeta weekStartDay (regla 4).
export function getPeriodRange(
  type: PeriodType,
  date: Date,
  weekStartDay: number
): { start: Date; end: Date } {
  switch (type) {
    case "dia":
      return { start: date, end: date };
    case "semana":
      return {
        start: startOfWeek(date, weekStartDay),
        end: endOfWeek(date, weekStartDay),
      };
    case "mes":
      return { start: startOfMonth(date), end: endOfMonth(date) };
    case "trimestre":
      return { start: startOfQuarter(date), end: endOfQuarter(date) };
    case "ano":
      return { start: startOfYear(date), end: endOfYear(date) };
  }
}

// Una fecha dentro del período anterior/siguiente, para navegar con ← →.
export function shiftPeriod(
  type: PeriodType,
  date: Date,
  direction: 1 | -1
): Date {
  switch (type) {
    case "dia":
      return addDays(date, direction);
    case "semana":
      return addDays(date, 7 * direction);
    case "mes":
      return new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + direction, 1)
      );
    case "trimestre":
      return new Date(
        Date.UTC(
          date.getUTCFullYear(),
          Math.floor(date.getUTCMonth() / 3) * 3 + 3 * direction,
          1
        )
      );
    case "ano":
      return new Date(Date.UTC(date.getUTCFullYear() + direction, 0, 1));
  }
}

export function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}
