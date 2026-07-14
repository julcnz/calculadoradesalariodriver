"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createRoute } from "@/server/actions/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldError } from "@/components/auth/field-error";

type CompanyOption = { id: string; name: string; isActive: boolean };

type RateRow = { key: number; name: string; amount: string };

// Regla 8: al crear una ruta se sugieren estas tarifas como punto de partida.
const SUGGESTED_RATES: Omit<RateRow, "key">[] = [
  { name: "Tarifa completa", amount: "1.45" },
  { name: "Tarifa doble", amount: "0.50" },
];

export function RouteForm({ companies }: { companies: CompanyOption[] }) {
  const defaultCompany =
    companies.find((c) => c.isActive)?.id ?? companies[0]?.id ?? "";
  const [companyId, setCompanyId] = useState(defaultCompany);
  const [rates, setRates] = useState<RateRow[]>(
    SUGGESTED_RATES.map((rate, i) => ({ ...rate, key: i }))
  );
  const [nextKey, setNextKey] = useState(SUGGESTED_RATES.length);
  const [state, formAction, isPending] = useActionState(createRoute, null);

  function updateRate(key: number, patch: Partial<RateRow>) {
    setRates((prev) =>
      prev.map((rate) => (rate.key === key ? { ...rate, ...patch } : rate))
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="companyId" value={companyId} />
      <Card>
        <CardHeader>
          <CardTitle>Nueva ruta</CardTitle>
          <CardDescription>
            Define la ruta y sus tarifas. Puedes ajustar nombres y valores, o
            agregar más tarifas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Empresa</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elige una empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                    {company.isActive ? " (actual)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={state?.errors?.companyId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="route-name">Nombre de la ruta</Label>
            <Input
              id="route-name"
              name="name"
              placeholder="Ej. Ruta Centro, DA5, Zona Norte…"
            />
            <FieldError errors={state?.errors?.name} />
          </div>

          <div className="space-y-2">
            <Label>Tarifas</Label>
            <div className="space-y-2">
              {rates.map((rate) => (
                <div key={rate.key} className="flex items-center gap-2">
                  <Input
                    name="rateName"
                    value={rate.name}
                    onChange={(e) =>
                      updateRate(rate.key, { name: e.target.value })
                    }
                    placeholder="Nombre de la tarifa"
                    className="flex-1"
                  />
                  <div className="relative w-28">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      name="rateAmount"
                      value={rate.amount}
                      onChange={(e) =>
                        updateRate(rate.key, { amount: e.target.value })
                      }
                      inputMode="decimal"
                      placeholder="0.00"
                      className="pl-7"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Quitar tarifa"
                    disabled={rates.length === 1}
                    onClick={() =>
                      setRates((prev) =>
                        prev.filter((r) => r.key !== rate.key)
                      )
                    }
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRates((prev) => [
                  ...prev,
                  { key: nextKey, name: "", amount: "" },
                ]);
                setNextKey((k) => k + 1);
              }}
            >
              <Plus className="size-4" />
              Agregar tarifa
            </Button>
            <FieldError errors={state?.errors?.rates} />
          </div>

          {state?.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
        </CardContent>
        <CardFooter className="mt-4">
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? "Guardando…" : "Crear ruta"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
