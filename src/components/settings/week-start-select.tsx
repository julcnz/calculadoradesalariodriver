"use client";

import { useTransition } from "react";
import { updateWeekStartDay } from "@/server/actions/settings";
import { WEEKDAYS_ES } from "@/lib/dates/week";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function WeekStartSelect({ current }: { current: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Label>Mi semana comienza el</Label>
      <Select
        value={String(current)}
        onValueChange={(value) =>
          startTransition(() => updateWeekStartDay(Number(value)))
        }
        disabled={isPending}
      >
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WEEKDAYS_ES.map((day, index) => (
            <SelectItem key={day} value={String(index)}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Ejemplo: si tu semana de pago va de {WEEKDAYS_ES[current]} a{" "}
        {WEEKDAYS_ES[(current + 6) % 7]}, todos los totales y gráficos
        semanales usarán ese rango.
      </p>
    </div>
  );
}
