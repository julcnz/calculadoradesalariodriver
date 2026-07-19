"use client";

import { useActionState } from "react";
import { createCompany } from "@/server/actions/companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Alta rápida desde Ajustes. Texto libre = regla 6 (isCustom, se guarda tal
// cual). La empresa nueva pasa a ser la activa (misma regla que /empresas).
export function CompanyQuickAdd() {
  const [state, formAction, isPending] = useActionState(createCompany, null);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="isCustom" value="true" />
      <div className="flex flex-wrap items-center gap-2">
        <Input
          name="name"
          placeholder="Nombre de la empresa"
          className="w-full max-w-56"
        />
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "…" : "Agregar"}
        </Button>
        {state?.success && (
          <p className="text-sm text-muted-foreground">Agregada ✓</p>
        )}
      </div>
      {state?.errors?.name?.[0] && (
        <p className="text-sm text-destructive">{state.errors.name[0]}</p>
      )}
      {state?.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
      <p className="text-xs text-muted-foreground">
        La empresa nueva queda como la activa.
      </p>
    </form>
  );
}
