"use client";

import { useActionState } from "react";
import { updateFuelSettings } from "@/server/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FuelSettingsForm({
  currentMpg,
  currentPrice,
}: {
  currentMpg: string;
  currentPrice: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateFuelSettings,
    null
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="vehicle-mpg">Rendimiento (mpg)</Label>
          <Input
            id="vehicle-mpg"
            name="vehicleMpg"
            inputMode="decimal"
            defaultValue={currentMpg}
            placeholder="Ej. 22"
            className="w-28"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fuel-price">Precio por galón</Label>
          <div className="relative w-28">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="fuel-price"
              name="fuelPricePerGallon"
              inputMode="decimal"
              defaultValue={currentPrice}
              placeholder="3.45"
              className="pl-7"
            />
          </div>
        </div>
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "…" : "Guardar"}
        </Button>
        {state?.success && (
          <p className="pb-2 text-sm text-muted-foreground">Guardado ✓</p>
        )}
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <p className="text-xs text-muted-foreground">
        Con esto el dashboard estima cuánto te cuesta la gasolina de las millas
        que registras. Deja ambos campos vacíos para desactivar la estimación.
      </p>
    </form>
  );
}
