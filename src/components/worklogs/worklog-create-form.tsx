"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { CloudOff } from "lucide-react";
import { createWorkLog } from "@/server/actions/worklogs";
import { enqueueWorkLog } from "@/lib/offline-queue";
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
import { Separator } from "@/components/ui/separator";
import { FieldError } from "@/components/auth/field-error";
import { WorkLogCommonFields } from "@/components/worklogs/worklog-fields";
import { formatCurrency } from "@/lib/format";

export type RouteWithRates = {
  id: string;
  name: string;
  companyName: string;
  rates: { id: string; name: string; amount: string }[];
};

// "Repetir ayer": ruta, cantidades y horas del último registro. La fecha
// siempre es hoy y las cantidades se cobran con la tarifa VIGENTE (esto es
// un registro nuevo, no una copia del snapshot).
export type WorkLogInitialValues = {
  routeId?: string;
  quantities?: Record<string, string>;
  startTime?: string;
  endTime?: string;
};

function todayLocalISO(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD en hora local
}

export function WorkLogCreateForm({
  routes,
  initial,
}: {
  routes: RouteWithRates[];
  initial?: WorkLogInitialValues;
}) {
  const [routeId, setRouteId] = useState(initial?.routeId ?? routes[0]?.id ?? "");
  const [quantities, setQuantities] = useState<Record<string, string>>(
    initial?.quantities ?? {}
  );
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [queuedOffline, setQueuedOffline] = useState(false);
  const [state, formAction, isPending] = useActionState(createWorkLog, null);

  const route = routes.find((r) => r.id === routeId);

  const total = useMemo(() => {
    if (!route) return 0;
    return route.rates.reduce((acc, rate) => {
      const qty = Number(quantities[rate.id] ?? 0) || 0;
      return acc + Math.round(Number(rate.amount) * 100) * qty;
    }, 0);
  }, [route, quantities]);

  // Sin conexión: el registro se guarda en el dispositivo y se envía
  // automáticamente al reconectar (ver <OfflineSyncer/>).
  function handleAction(formData: FormData) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueWorkLog(formData);
      setQueuedOffline(true);
      return;
    }
    formAction(formData);
  }

  if (queuedOffline) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudOff className="size-5" />
            Guardado sin conexión
          </CardTitle>
          <CardDescription>
            No hay internet ahora mismo, pero tu registro quedó guardado en
            este dispositivo y se enviará automáticamente cuando vuelva la
            conexión. No cierres sesión mientras tanto.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex gap-2">
          <Button type="button" onClick={() => setQueuedOffline(false)}>
            Registrar otro día
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Ir al dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <form action={handleAction}>
      <input type="hidden" name="routeId" value={routeId} />
      <Card>
        <CardHeader>
          <CardTitle>Nuevo registro de trabajo</CardTitle>
          <CardDescription>
            Registra los paquetes entregados hoy (o la fecha que elijas).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Ruta</Label>
            <Select value={routeId} onValueChange={setRouteId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elige una ruta" />
              </SelectTrigger>
              <SelectContent>
                {routes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} · {r.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={state?.errors?.routeId} />
          </div>

          <div className="space-y-2">
            <Label>Paquetes por tarifa</Label>
            <div className="space-y-2">
              {route?.rates.map((rate) => (
                <div key={rate.id} className="flex items-center gap-3">
                  <input type="hidden" name="rateTypeId" value={rate.id} />
                  <div className="flex-1">
                    <p className="text-sm">{rate.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(rate.amount)} c/u
                    </p>
                  </div>
                  <Input
                    name="quantity"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    placeholder="0"
                    value={quantities[rate.id] ?? ""}
                    onChange={(e) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [rate.id]: e.target.value,
                      }))
                    }
                    className="w-24 text-right"
                  />
                </div>
              ))}
            </div>
            <FieldError errors={state?.errors?.quantities} />
          </div>

          <Separator />

          <WorkLogCommonFields
            defaults={{
              date: todayLocalISO(),
              miles: "",
              odometerStart: "",
              odometerEnd: "",
              note: "",
            }}
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            errors={state?.errors}
          />

          {state?.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
        </CardContent>
        <CardFooter className="mt-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total del día</p>
            <p className="text-xl font-bold">{formatCurrency(total / 100)}</p>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar registro"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
