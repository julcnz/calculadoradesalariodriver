import { cn } from "@/lib/utils";

// Lista de rendimiento con barras CSS (patrón del desglose de gastos). Server
// component puro: recibe las filas ya calculadas. La usa la tarjeta
// "Rendimiento", que cambia de sub-unidad según el selector (día de la semana,
// semana, mes, trimestre o año).
export type PerformanceRow = {
  key: string;
  label: string;
  // Texto secundario en gris (p. ej. "2 días" o "3 días · en curso").
  meta: string;
  // Valor destacado a la derecha (p. ej. "$38.49/h" o "$614.50").
  value: string;
  // Ancho de la barra, 0–1.
  fraction: number;
  // Fila que más rinde: se resalta en verde.
  best: boolean;
};

export function PerformanceList({ rows }: { rows: PerformanceRow[] }) {
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.key} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className={cn("shrink-0", row.best && "font-semibold")}>
              {row.label}
            </span>
            <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
              {row.meta}
            </span>
            <span
              className={cn(
                "ml-auto shrink-0 tabular-nums",
                row.best && "font-semibold"
              )}
            >
              {row.value}
            </span>
          </div>
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className={cn(
                "h-full rounded-full",
                row.best ? "bg-emerald-500" : "bg-foreground/40"
              )}
              style={{
                width: `${Math.max(0, Math.min(1, row.fraction)) * 100}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
