import { addDays, startOfWeek, toDateParam } from "@/lib/dates/week";
import { formatDate } from "@/lib/format";
import {
  ActivityCalendarGrid,
  type CalendarCell,
} from "./activity-calendar-grid";

const WEEKS = 12;

// Mapa de constancia estilo GitHub: una columna por semana (respetando el
// día de inicio personalizado), un cuadrito por día, intensidad según la
// ganancia de ese día. Calcula las celdas en el server y delega el render +
// el popup al tocar a un client component.
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

  const weeks: CalendarCell[][] = Array.from(
    { length: WEEKS },
    (_, weekIndex) =>
      Array.from({ length: 7 }, (_, dayIndex) => {
        const date = addDays(gridStart, weekIndex * 7 + dayIndex);
        const cents = byDay.get(toDateParam(date)) ?? 0;
        return {
          key: toDateParam(date),
          label: formatDate(date),
          cents,
          isFuture: date > today,
          intensity:
            cents > 0 && maxCents > 0 ? 0.3 + 0.7 * (cents / maxCents) : 0,
        };
      })
  );

  return (
    <div className="space-y-2">
      <ActivityCalendarGrid weeks={weeks} />
      <p className="text-muted-foreground text-xs">
        Últimas {WEEKS} semanas · más oscuro = más ganancia · toca un día para
        ver su ganancia.
      </p>
    </div>
  );
}
