"use client";

import { useActionState, useState } from "react";
import { createRouteFromSettings } from "@/server/actions/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Alta rápida desde Ajustes: crea la ruta con las tarifas sugeridas (regla
// 8); se editan después en /rutas. La primera empresa de la lista es la
// activa (el orden lo garantiza la página).
export function RouteQuickAdd({
  companies,
}: {
  companies: { id: string; name: string }[];
}) {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [state, formAction, isPending] = useActionState(
    createRouteFromSettings,
    null
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="rateName" value="Tarifa completa" />
      <input type="hidden" name="rateAmount" value="1.45" />
      <input type="hidden" name="rateName" value="Tarifa doble" />
      <input type="hidden" name="rateAmount" value="0.50" />
      <div className="flex flex-wrap items-center gap-2">
        <Input
          name="name"
          placeholder="Nombre de la ruta"
          className="w-full max-w-44"
        />
        {companies.length > 1 && (
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger className="w-44" aria-label="Empresa de la ruta">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
        Se crea con las tarifas sugeridas ($1.45 completa · $0.50 doble);
        ajústalas en Mis rutas.
      </p>
    </form>
  );
}
