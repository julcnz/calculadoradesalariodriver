import { addDays, startOfWeek, toDateParam } from "@/lib/dates/week";
import { formatCurrency, formatDate } from "@/lib/format";

const WEEKS = 12;

// Mapa de constancia estilo GitHub: una columna por semana (respetando el
// día de inicio personalizado), un cuadrito por día, intensidad según la
// ganancia de ese día. Server component puro.
export function ActivityCalendar({
  byDay,
  today,
  weekStartDay,
}: {
  byDay: Map<string, number>; // yyyy-mm-dd → centavos
  today: Date;
  weekStartDay: number;
}) {
  const currentWeekStart = startOfWeek(today, weekStartDay);
  const gridStart = addDays(currentWeekStart, -7 * (WEEKS - 1));
  const maxCents = Math.max(0, ...byDay.values());

  const weeks = Array.from({ length: WEEKS }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = addDays(gridStart, weekIndex * 7 + dayIndex);
      const cents = byDay.get(toDateParam(date)) ?? 0;
      return { date, cents, isFuture: date > today };
    })
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-1">
            {week.map(({ date, cents, isFuture }) => {
              if (isFuture) {
                return (
                  <div key={date.toISOString()} className="size-3.5 rounded-[3px]" />
                );
              }
              const intensity =
                cents > 0 && maxCents > 0
                  ? 0.3 + 0.7 * (cents / maxCents)
                  : 0;
              return (
                <div
                  key={date.toISOString()}
                  title={`${formatDate(date)} · ${
                    cents > 0 ? formatCurrency(cents / 100) : "Sin registro"
                  }`}
                  className={
                    cents > 0
                      ? "size-3.5 rounded-[3px] bg-primary"
                      : "size-3.5 rounded-[3px] bg-muted"
                  }
                  style={cents > 0 ? { opacity: intensity } : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Últimas {WEEKS} semanas · más oscuro = más ganancia · pasa el cursor
        para ver el día.
      </p>
    </div>
  );
}
