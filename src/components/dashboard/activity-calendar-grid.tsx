"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";

// Cuadros del calendario de constancia + popup al tocar/click. Recibe las
// celdas ya calculadas por el server component (datos planos, serializables).
export type CalendarCell = {
  key: string; // yyyy-mm-dd
  label: string; // "17 jul 2026"
  cents: number;
  isFuture: boolean;
  intensity: number; // 0–1 (opacidad del cuadro)
};

type Selected = {
  key: string;
  label: string;
  value: string;
  x: number;
  y: number;
};

export function ActivityCalendarGrid({ weeks }: { weeks: CalendarCell[][] }) {
  const [selected, setSelected] = useState<Selected | null>(null);

  // Cerrar el popup al tocar fuera de un cuadro, al hacer scroll o redimensionar
  // (el popup es fixed y se despegaría del cuadro).
  useEffect(() => {
    if (!selected) return;
    const close = () => setSelected(null);
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-cal-cell]")) return; // otro cuadro: lo maneja su onClick
      close();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [selected]);

  const toggleCell = (
    cell: CalendarCell,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSelected((prev) =>
      prev?.key === cell.key
        ? null
        : {
            key: cell.key,
            label: cell.label,
            value:
              cell.cents > 0
                ? formatCurrency(cell.cents / 100)
                : "Sin registro",
            x: rect.left + rect.width / 2,
            y: rect.top,
          }
    );
  };

  return (
    <>
      <div className="grid grid-cols-12 gap-1">
        {weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-1">
            {week.map((cell) => {
              if (cell.isFuture) {
                return (
                  <div key={cell.key} className="aspect-square rounded-[18%]" />
                );
              }
              const hasEarnings = cell.cents > 0;
              return (
                <button
                  key={cell.key}
                  type="button"
                  data-cal-cell
                  aria-label={`${cell.label} · ${
                    hasEarnings
                      ? formatCurrency(cell.cents / 100)
                      : "Sin registro"
                  }`}
                  title={`${cell.label} · ${
                    hasEarnings
                      ? formatCurrency(cell.cents / 100)
                      : "Sin registro"
                  }`}
                  onClick={(event) => toggleCell(cell, event)}
                  className={
                    hasEarnings
                      ? "bg-primary aspect-square cursor-pointer rounded-[18%]"
                      : "bg-muted aspect-square cursor-pointer rounded-[18%]"
                  }
                  style={hasEarnings ? { opacity: cell.intensity } : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>

      {selected && (
        <div
          role="status"
          className="bg-popover pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-md border px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md"
          style={{
            left: Math.min(
              Math.max(selected.x, 72),
              (typeof window !== "undefined" ? window.innerWidth : 0) - 72
            ),
            top: selected.y - 8,
          }}
        >
          <span className="text-popover-foreground font-medium">
            {selected.label}
          </span>
          <span className="text-muted-foreground"> · </span>
          <span className="text-popover-foreground font-semibold tabular-nums">
            {selected.value}
          </span>
        </div>
      )}
    </>
  );
}
