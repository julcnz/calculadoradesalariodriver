import { WEEKDAYS_ES } from "@/lib/dates/week";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WeekdayPerformance } from "@/lib/metrics";

// Tarjeta "Rendimiento por día": barras CSS (patrón del desglose de gastos),
// orden fijo Lun→Dom. Server component puro: recibe las filas ya calculadas.
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function WeekdayPerformanceTable({
  rows,
}: {
  rows: WeekdayPerformance[];
}) {
  const byWeekday = new Map(rows.map((row) => [row.weekday, row]));
  const ordered = WEEKDAY_ORDER.map((weekday) => byWeekday.get(weekday)).filter(
    (row): row is WeekdayPerformance => row !== undefined
  );
  const maxAvg = Math.max(
    ...ordered.map((row) => row.avgDayCents ?? 0),
    1
  );
  const bestAvg = Math.max(...ordered.map((row) => row.avgDayCents ?? 0));

  return (
    <div className="space-y-2">
      {ordered.map((row) => {
        const isBest = row.avgDayCents !== null && row.avgDayCents === bestAvg;
        return (
          <div key={row.weekday} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className={cn("w-20 shrink-0", isBest && "font-semibold")}>
                {WEEKDAYS_ES[row.weekday]}
              </span>
              <span className="text-xs text-muted-foreground">
                {row.daysWorked > 0
                  ? `${row.daysWorked} ${row.daysWorked === 1 ? "día" : "días"}` +
                    (row.perHourCents !== null
                      ? ` · ${formatCurrency(row.perHourCents / 100)}/h`
                      : "") +
                    (row.perPackageCents !== null
                      ? ` · ${formatCurrency(row.perPackageCents / 100)}/paq`
                      : "")
                  : "Sin registros"}
              </span>
              <span
                className={cn(
                  "ml-auto shrink-0 tabular-nums",
                  isBest && "font-semibold"
                )}
              >
                {row.avgDayCents !== null
                  ? formatCurrency(row.avgDayCents / 100)
                  : "—"}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  isBest ? "bg-emerald-500" : "bg-foreground/40"
                )}
                style={{
                  width: `${((row.avgDayCents ?? 0) / maxAvg) * 100}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
