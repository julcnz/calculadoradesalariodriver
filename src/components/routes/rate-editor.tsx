"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Plus } from "lucide-react";
import {
  addRateType,
  toggleRateTypeActive,
  updateRateType,
} from "@/server/actions/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/field-error";

export type RateItem = {
  id: string;
  name: string;
  amount: string;
  isActive: boolean;
};

function RateRow({ rate }: { rate: RateItem }) {
  const [state, formAction, isPending] = useActionState(updateRateType, null);
  const [isToggling, startToggle] = useTransition();

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="rateTypeId" value={rate.id} />
      <div className="flex items-center gap-2">
        <Input
          name="rateName"
          defaultValue={rate.name}
          disabled={!rate.isActive}
          className="flex-1"
        />
        <div className="relative w-28">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
            $
          </span>
          <Input
            name="rateAmount"
            defaultValue={rate.amount}
            inputMode="decimal"
            disabled={!rate.isActive}
            className="pl-7"
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={isPending || !rate.isActive}
        >
          {isPending ? "…" : "Guardar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isToggling}
          onClick={() => startToggle(() => toggleRateTypeActive(rate.id))}
        >
          {rate.isActive ? "Desactivar" : "Reactivar"}
        </Button>
      </div>
      <FieldError errors={state?.errors?.name} />
      <FieldError errors={state?.errors?.amount} />
      {state?.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
    </form>
  );
}

function AddRateForm({ routeId }: { routeId: string }) {
  const [state, formAction, isPending] = useActionState(addRateType, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === null) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <Label>Agregar tarifa</Label>
      <div className="flex items-center gap-2">
        <input type="hidden" name="routeId" value={routeId} />
        <Input
          name="rateName"
          placeholder="Nombre (ej. Tarifa nocturna)"
          className="flex-1"
        />
        <div className="relative w-28">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
            $
          </span>
          <Input
            name="rateAmount"
            inputMode="decimal"
            placeholder="0.00"
            className="pl-7"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          <Plus className="size-4" />
          {isPending ? "…" : "Agregar"}
        </Button>
      </div>
      <FieldError errors={state?.errors?.name} />
      <FieldError errors={state?.errors?.amount} />
      {state?.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
    </form>
  );
}

export function RateEditor({
  routeId,
  rates,
}: {
  routeId: string;
  rates: RateItem[];
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rates.map((rate) => (
          <RateRow key={rate.id} rate={rate} />
        ))}
      </div>
      <AddRateForm routeId={routeId} />
      <p className="text-xs text-muted-foreground">
        Editar una tarifa solo afecta registros futuros: los registros pasados
        conservan el valor que tenía la tarifa en ese momento.
      </p>
    </div>
  );
}
