import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import {
  getPeriodRange,
  shiftPeriod,
  toDateParam,
  type PeriodType,
} from "@/lib/dates/week";
import { formatPeriodRange, formatPeriodRangeShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const PERIOD_LABELS: Record<PeriodType, string> = {
  dia: "Día",
  semana: "Semana",
  mes: "Mes",
  trimestre: "Trimestre",
  ano: "Año",
};

function buildHref(
  periodo: PeriodType,
  fecha: string | null,
  empresa?: string
): string {
  const params = new URLSearchParams();
  params.set("periodo", periodo);
  if (fecha) params.set("fecha", fecha);
  if (empresa) params.set("empresa", empresa);
  return `/dashboard?${params.toString()}`;
}

export function PeriodSelector({
  periodo,
  date,
  today,
  weekStartDay,
  empresa,
  actions,
}: {
  periodo: PeriodType;
  date: Date;
  today: Date;
  weekStartDay: number;
  empresa?: string;
  actions?: ReactNode;
}) {
  const fecha = toDateParam(date);
  const { start, end } = getPeriodRange(periodo, date, weekStartDay);
  const isCurrentPeriod = today >= start && today <= end;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {(Object.keys(PERIOD_LABELS) as PeriodType[]).map((type) => (
          <Link
            key={type}
            href={buildHref(type, fecha, empresa)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              type === periodo
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {PERIOD_LABELS[type]}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {/* Grupo de navegación: se mantiene junto (no se parte al envolver). */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="icon"
            aria-label="Período anterior"
          >
            <Link
              href={buildHref(
                periodo,
                toDateParam(shiftPeriod(periodo, date, -1)),
                empresa
              )}
            >
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <p className="min-w-20 text-center text-sm font-medium sm:min-w-32">
            {/* Compacto en móvil (sin año) para que "Compartir" no baje;
                completo desde sm. */}
            <span className="sm:hidden">
              {formatPeriodRangeShort(periodo, start, end)}
            </span>
            <span className="hidden sm:inline">
              {formatPeriodRange(periodo, start, end)}
            </span>
          </p>
          <Button
            asChild
            variant="outline"
            size="icon"
            aria-label="Período siguiente"
          >
            <Link
              href={buildHref(
                periodo,
                toDateParam(shiftPeriod(periodo, date, 1)),
                empresa
              )}
            >
              <ChevronRight className="size-4" />
            </Link>
          </Button>
          {!isCurrentPeriod && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Volver a hoy"
              title="Volver a hoy"
            >
              <Link href={buildHref(periodo, null, empresa)}>
                <RotateCcw className="size-4" />
              </Link>
            </Button>
          )}
        </div>
        {actions}
      </div>
    </div>
  );
}
