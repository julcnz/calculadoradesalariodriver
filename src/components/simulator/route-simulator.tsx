"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SimRow = {
  id: number;
  name: string;
  amount: string;
  quantity: string;
};

// Sugerencias de la regla 8 (mismas que al crear una ruta real).
const INITIAL_ROWS: SimRow[] = [
  { id: 1, name: "Tarifa completa", amount: "1.45", quantity: "" },
  { id: 2, name: "Tarifa doble", amount: "0.50", quantity: "" },
];

function parseAmountCents(raw: string): number {
  const value = Number(raw.trim().replace(",", "."));
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : 0;
}

function parseQuantity(raw: string): number {
  const value = Number(raw.trim());
  return Number.isInteger(value) && value > 0 ? value : 0;
}

function ComparisonLine({
  label,
  simulatedCents,
  historicalCents,
}: {
  label: string;
  simulatedCents: number | null;
  historicalCents: number | null;
}) {
  if (simulatedCents === null) return null;
  if (historicalCents === null || historicalCents === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Sin histórico de {label} para comparar.
      </p>
    );
  }
  const pct = Math.round(
    ((simulatedCents - historicalCents) / historicalCents) * 100
  );
  const better = pct >= 0;
  return (
    <p className="text-sm">
      <span className={cn("font-semibold", better ? "text-emerald-600 dark:text-emerald-500" : "text-destructive")}>
        {better ? "▲" : "▼"} {pct >= 0 ? "+" : ""}
        {pct}%
      </span>{" "}
      <span className="text-muted-foreground">
        vs tu {label} histórico ({formatCurrency(historicalCents / 100)})
      </span>
    </p>
  );
}

export function RouteSimulator({
  historicalPerHourCents,
  historicalPerPackageCents,
}: {
  historicalPerHourCents: number | null;
  historicalPerPackageCents: number | null;
}) {
  const [rows, setRows] = useState<SimRow[]>(INITIAL_ROWS);
  const [nextId, setNextId] = useState(3);
  const [hours, setHours] = useState("");

  const totalCents = rows.reduce(
    (acc, row) => acc + parseAmountCents(row.amount) * parseQuantity(row.quantity),
    0
  );
  const totalPackages = rows.reduce(
    (acc, row) => acc + parseQuantity(row.quantity),
    0
  );
  const hoursValue = Number(hours.trim().replace(",", "."));
  const validHours = Number.isFinite(hoursValue) && hoursValue > 0;
  const perPackageCents =
    totalPackages > 0 ? Math.round(totalCents / totalPackages) : null;
  const perHourCents = validHours
    ? Math.round(totalCents / hoursValue)
    : null;

  const updateRow = (id: number, patch: Partial<SimRow>) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">La ruta que te ofrecen</CardTitle>
          <CardDescription>
            Tarifas por paquete y cuántos estimas entregar en un día.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.map((row) => (
            <div key={row.id} className="flex items-end gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor={`sim-name-${row.id}`} className="text-xs">
                  Tarifa
                </Label>
                <Input
                  id={`sim-name-${row.id}`}
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  placeholder="Nombre"
                />
              </div>
              <div className="w-24 space-y-1">
                <Label htmlFor={`sim-amount-${row.id}`} className="text-xs">
                  $/paquete
                </Label>
                <Input
                  id={`sim-amount-${row.id}`}
                  inputMode="decimal"
                  value={row.amount}
                  onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                  placeholder="1.45"
                />
              </div>
              <div className="w-24 space-y-1">
                <Label htmlFor={`sim-qty-${row.id}`} className="text-xs">
                  Paquetes
                </Label>
                <Input
                  id={`sim-qty-${row.id}`}
                  inputMode="numeric"
                  value={row.quantity}
                  onChange={(e) =>
                    updateRow(row.id, { quantity: e.target.value })
                  }
                  placeholder="120"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setRows((prev) => prev.filter((r) => r.id !== row.id))
                }
                disabled={rows.length === 1}
                aria-label={`Quitar ${row.name || "tarifa"}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setRows((prev) => [
                ...prev,
                { id: nextId, name: "", amount: "", quantity: "" },
              ]);
              setNextId((id) => id + 1);
            }}
          >
            <Plus className="size-4" />
            Agregar tarifa
          </Button>

          <div className="max-w-40 space-y-1">
            <Label htmlFor="sim-hours" className="text-xs">
              Horas estimadas (opcional)
            </Label>
            <Input
              id="sim-hours"
              inputMode="decimal"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Ej. 5.5"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cómo pinta</CardTitle>
          <CardDescription>Un día con esos números.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-3xl font-bold tracking-tight">
              {formatCurrency(totalCents / 100)}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalPackages} paquetes
              {validHours && ` · ${hours.trim().replace(",", ".")} h`}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">
                {perPackageCents !== null
                  ? `${formatCurrency(perPackageCents / 100)}/paquete`
                  : "—/paquete"}
              </p>
              <ComparisonLine
                label="$/paquete"
                simulatedCents={perPackageCents}
                historicalCents={historicalPerPackageCents}
              />
            </div>
            <div>
              <p className="text-sm font-medium">
                {perHourCents !== null
                  ? `${formatCurrency(perHourCents / 100)}/h`
                  : "—/h (agrega horas)"}
              </p>
              <ComparisonLine
                label="$/hora"
                simulatedCents={perHourCents}
                historicalCents={historicalPerHourCents}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            La comparativa usa tus últimas 12 semanas reales. Nada de esto se
            guarda: es solo para decidir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
