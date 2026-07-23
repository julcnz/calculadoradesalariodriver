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

// Rango legible de un período según su tipo, dado el inicio y el fin ya
// calculados. Compartido por el selector del dashboard y el resumen público.
export function formatPeriodRange(
  periodType: import("@/lib/dates/week").PeriodType,
  start: Date,
  end: Date
): string {
  switch (periodType) {
    case "dia":
      return formatDate(start);
    case "semana":
      return `${formatDate(start)} – ${formatDate(end)}`;
    case "mes": {
      const label = new Intl.DateTimeFormat("es", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(start);
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
    case "trimestre":
      return `T${Math.floor(start.getUTCMonth() / 3) + 1} ${start.getUTCFullYear()}`;
    case "ano":
      return String(start.getUTCFullYear());
  }
}

const shortDateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

// Variante compacta del rango (sin año) para móvil: así el rótulo no empuja
// al botón "Compartir" a una segunda línea. Día "17 jul"; semana "13–19 jul"
// o "28 jul – 3 ago"; mes "jul 2026". Trimestre/año ya son cortos.
export function formatPeriodRangeShort(
  periodType: import("@/lib/dates/week").PeriodType,
  start: Date,
  end: Date
): string {
  switch (periodType) {
    case "dia":
      return shortDateFormatter.format(start);
    case "semana": {
      const sameMonth =
        start.getUTCMonth() === end.getUTCMonth() &&
        start.getUTCFullYear() === end.getUTCFullYear();
      return sameMonth
        ? `${start.getUTCDate()}–${shortDateFormatter.format(end)}`
        : `${shortDateFormatter.format(start)} – ${shortDateFormatter.format(end)}`;
    }
    case "mes": {
      const label = new Intl.DateTimeFormat("es", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(start);
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
    case "trimestre":
    case "ano":
      return formatPeriodRange(periodType, start, end);
  }
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
