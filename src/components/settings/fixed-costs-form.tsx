"use client";

import { useActionState } from "react";
import { updateMonthlyFixedCosts } from "@/server/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FixedCostsForm({ current }: { current: string }) {
  const [state, formAction, isPending] = useActionState(
    updateMonthlyFixedCosts,
    null
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="monthly-fixed-costs">Gastos fijos al mes</Label>
        <div className="flex items-center gap-2">
          <div className="relative w-32">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="monthly-fixed-costs"
              name="monthlyFixedCosts"
              inputMode="decimal"
              defaultValue={current}
              placeholder="850"
              className="pl-7"
            />
          </div>
          <Button type="submit" variant="outline" disabled={isPending}>
            {isPending ? "…" : "Guardar"}
          </Button>
          {state?.success && (
            <p className="text-sm text-muted-foreground">Guardado ✓</p>
          )}
        </div>
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Suma lo que pagas sí o sí cada mes: renta o pago del carro, seguro,
          teléfono… El dashboard calcula cuántos paquetes al día necesitas para
          cubrirlos. Déjalo vacío para ocultar el punto de equilibrio.
        </p>
      </div>
    </form>
  );
}
