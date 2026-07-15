"use client";

import { useActionState } from "react";
import { saveGoals } from "@/server/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/field-error";

const FIELDS = [
  { name: "daily", label: "Diaria" },
  { name: "weekly", label: "Semanal" },
  { name: "monthly", label: "Mensual" },
  { name: "yearly", label: "Anual" },
] as const;

export function GoalsForm({
  defaults,
}: {
  defaults: Record<(typeof FIELDS)[number]["name"], string>;
}) {
  const [state, formAction, isPending] = useActionState(saveGoals, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {FIELDS.map(({ name, label }) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={`goal-${name}`}>{label}</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                $
              </span>
              <Input
                id={`goal-${name}`}
                name={name}
                inputMode="decimal"
                placeholder="—"
                defaultValue={defaults[name]}
                className="pl-7"
              />
            </div>
            <FieldError errors={state?.errors?.[name]} />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Deja un campo vacío para no tener meta en ese período. El progreso se
        muestra en el dashboard sobre los ingresos.
      </p>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar metas"}
        </Button>
        {state?.success && (
          <p className="text-sm text-muted-foreground">Metas guardadas ✓</p>
        )}
      </div>
    </form>
  );
}
