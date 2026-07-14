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
export function todayAsBusinessDate(): Date {
  return new Date(new Date().toLocaleDateString("en-CA"));
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
