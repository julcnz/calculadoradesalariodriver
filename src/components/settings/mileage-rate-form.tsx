"use client";

import { useActionState } from "react";
import { updateMileageRate } from "@/server/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MileageRateForm({ current }: { current: string }) {
  const [state, formAction, isPending] = useActionState(
    updateMileageRate,
    null
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="mileage-rate">Tarifa por milla</Label>
        <div className="flex items-center gap-2">
          <div className="relative w-28">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="mileage-rate"
              name="mileageRate"
              inputMode="decimal"
              defaultValue={current}
              className="pl-7"
            />
          </div>
          <Button type="submit" variant="outline" disabled={isPending}>
            {isPending ? "…" : "Guardar"}
          </Button>
          {state?.success && (
            <p className="text-sm text-muted-foreground">Guardada ✓</p>
          )}
        </div>
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <p className="text-xs text-muted-foreground">
          La tarifa estándar del IRS ronda $0.70 por milla (verifica la del
          año fiscal vigente). El dashboard estima tu deducción multiplicando
          las millas registradas por esta tarifa.
        </p>
      </div>
    </form>
  );
}
