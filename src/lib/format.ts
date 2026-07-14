const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCurrency(value: number | string): string {
  return currencyFormatter.format(Number(value));
}

const dateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC", // las fechas de negocio se guardan como fecha pura (@db.Date)
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

// Muestra valores opcionales: null/undefined → "—" (regla 2: nunca inventar 0).
export function formatOptional(
  value: number | string | null | undefined,
  format: (v: number | string) => string = String
): string {
  if (value === null || value === undefined || value === "") return "—";
  return format(value);
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
