import { cn } from "@/lib/utils";

// Recreación estática del dashboard con datos FICTICIOS para la landing.
// Puramente decorativa: los lectores de pantalla reciben un resumen textual.

const HEATMAP: number[][] = [
  [0, 2, 3, 0, 1, 2, 0],
  [1, 3, 2, 2, 0, 3, 0],
  [2, 2, 0, 3, 2, 1, 0],
  [3, 1, 2, 2, 3, 0, 0],
  [2, 3, 3, 1, 2, 2, 0],
  [0, 2, 1, 3, 3, 1, 0],
  [2, 3, 2, 2, 1, 3, 0],
  [3, 2, 3, 0, 2, 2, 0],
  [1, 3, 2, 3, 3, 0, 0],
  [2, 2, 3, 2, 1, 2, 0],
  [3, 3, 1, 2, 3, 2, 0],
  [2, 3, 3, 3, 2, 0, 0],
];

const OPACITY = ["opacity-0", "opacity-30", "opacity-60", "opacity-100"];

function Stat({
  label,
  value,
  detail,
  valueClass,
}: {
  label: string;
  value: string;
  detail: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-bold tracking-tight tabular-nums", valueClass)}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{detail}</p>
    </div>
  );
}

export function DashboardPreview() {
  return (
    <div
      aria-hidden
      className="select-none overflow-hidden rounded-xl border bg-background shadow-2xl"
    >
      {/* barra de "navegador" */}
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        </span>
        <span className="mx-auto rounded-md bg-background px-3 py-0.5 text-[10px] text-muted-foreground">
          salariodriver.app/dashboard
        </span>
      </div>

      <div className="space-y-3 p-4">
        {/* selector de período */}
        <div className="flex flex-wrap items-center gap-1.5">
          {["Día", "Semana", "Mes", "Trimestre", "Año"].map((p) => (
            <span
              key={p}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-medium",
                p === "Semana"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {p}
            </span>
          ))}
          <span className="ml-auto text-[10px] font-medium text-muted-foreground">
            14 jul – 20 jul
          </span>
        </div>

        {/* tarjetas */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-[10px] text-muted-foreground">Ingresos</p>
            <p className="text-lg font-bold tracking-tight tabular-nums">
              $487.20
            </p>
            <p className="mt-0.5 text-[10px] font-medium">
              ▲ +12% vs semana anterior
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[81%] rounded-full bg-primary" />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Meta: $600 · 81%
            </p>
          </div>
          <Stat
            label="Gastos"
            value="−$96.40"
            detail="Gasolina 62% · Peajes 21%"
          />
          <Stat
            label="Ganancia neta"
            value="$390.80"
            detail="Margen: 80%"
            valueClass="text-emerald-600 dark:text-emerald-400"
          />
          <Stat
            label="Promedios"
            value="$24.30/h"
            detail="$1.82/milla · Deducción $148.75"
          />
        </div>

        {/* constancia */}
        <div className="rounded-lg border bg-card p-3">
          <p className="mb-2 text-[10px] text-muted-foreground">
            Constancia · 🔥 Racha: 5 días
          </p>
          <div className="flex gap-1">
            {HEATMAP.map((week, i) => (
              <div key={i} className="flex flex-col gap-1">
                {week.map((level, j) => (
                  <span key={j} className="size-2 rounded-[2px] bg-muted">
                    <span
                      className={cn(
                        "block size-full rounded-[2px] bg-primary",
                        OPACITY[level]
                      )}
                    />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* rutas */}
        <div className="rounded-lg border bg-card p-3">
          <p className="mb-2 text-[10px] text-muted-foreground">
            Ganancias por ruta
          </p>
          <div className="space-y-1.5">
            {[
              { name: "Ruta Centro", width: "w-[76%]", amount: "$312.40" },
              { name: "Zona Norte", width: "w-[43%]", amount: "$174.80" },
            ].map((route) => (
              <div key={route.name} className="flex items-center gap-2">
                <span className="w-20 shrink-0 truncate text-[10px]">
                  {route.name}
                </span>
                <span className="h-3 flex-1 overflow-hidden rounded-sm bg-muted">
                  <span
                    className={cn(
                      "block h-full rounded-sm bg-primary/70",
                      route.width
                    )}
                  />
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {route.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
