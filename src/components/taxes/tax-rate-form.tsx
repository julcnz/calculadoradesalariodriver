"use client";

import { useActionState } from "react";
import { updateIncomeTaxRate } from "@/server/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TaxRateForm({ current }: { current: string }) {
  const [state, formAction, isPending] = useActionState(
    updateIncomeTaxRate,
    null
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="income-tax-rate">
          Tasa efectiva de impuesto sobre ingreso
        </Label>
        <div className="flex items-center gap-2">
          <div className="relative w-28">
            <Input
              id="income-tax-rate"
              name="incomeTaxRate"
              inputMode="decimal"
              defaultValue={current}
              className="pr-8"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              %
            </span>
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
          Es el porcentaje de impuesto federal (y estatal, si aplica) sobre tu
          ganancia, según tu situación: estado civil, deducción estándar, otros
          ingresos. Con ingresos bajos-medios suele quedar entre 0% y 12%. El
          impuesto de autoempleo (15.3%) se calcula aparte y no va aquí.
        </p>
      </div>
    </form>
  );
}
