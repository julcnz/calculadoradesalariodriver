"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { revokeSharedWeek } from "@/server/actions/shared-weeks";
import { Button } from "@/components/ui/button";

export type SharedWeekItem = {
  id: string;
  weekLabel: string;
  createdLabel: string;
};

export function SharedWeeksList({ items }: { items: SharedWeekItem[] }) {
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No has compartido ninguna semana. Hazlo desde el dashboard con el
        botón &ldquo;Compartir semana&rdquo; en la vista semanal.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">{item.weekLabel}</p>
            <p className="text-xs text-muted-foreground">
              Compartida el {item.createdLabel}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => revokeSharedWeek(item.id))}
          >
            <Trash2 className="size-4" />
            Revocar
          </Button>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Revocar un enlace lo deja de mostrar para siempre. El enlace completo
        solo se muestra al crearlo; para recuperarlo, vuelve a compartir esa
        semana desde el dashboard.
      </p>
    </div>
  );
}
