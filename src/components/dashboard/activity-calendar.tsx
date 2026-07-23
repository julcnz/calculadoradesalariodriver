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
      {/* Una columna por semana (grid-cols-12) que ocupa todo el ancho; los
          cuadros son cuadrados (aspect-square) y se estiran de borde a borde. */}
      <div className="grid grid-cols-12 gap-1">
        {weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-1">
            {week.map(({ date, cents, isFuture }) => {
              if (isFuture) {
                return (
                  <div
                    key={date.toISOString()}
                    className="aspect-square rounded-[18%]"
                  />
                );
              }
              const intensity =
                cents > 0 && maxCents > 0 ? 0.3 + 0.7 * (cents / maxCents) : 0;
              return (
                <div
                  key={date.toISOString()}
                  title={`${formatDate(date)} · ${
                    cents > 0 ? formatCurrency(cents / 100) : "Sin registro"
                  }`}
                  className={
                    cents > 0
                      ? "bg-primary aspect-square rounded-[18%]"
                      : "bg-muted aspect-square rounded-[18%]"
                  }
                  style={cents > 0 ? { opacity: intensity } : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        Últimas {WEEKS} semanas · más oscuro = más ganancia · pasa el cursor
        para ver el día.
      </p>
    </div>
  );
}
