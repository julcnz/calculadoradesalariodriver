"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteWorkLog, updateWorkLog } from "@/server/actions/worklogs";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { WorkLogCommonFields } from "@/components/worklogs/worklog-fields";
import { formatCurrency } from "@/lib/format";

export type WorkLogForEdit = {
  id: string;
  routeName: string;
  companyName: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  miles: string;
  note: string;
  entries: {
    id: string;
    nameSnapshot: string;
    amountSnapshot: string;
    quantity: number;
  }[];
};

export function WorkLogEditForm({ workLog }: { workLog: WorkLogForEdit }) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      workLog.entries.map((entry) => [entry.id, String(entry.quantity)])
    )
  );
  const [startTime, setStartTime] = useState(workLog.startTime);
  const [endTime, setEndTime] = useState(workLog.endTime);
  const [state, formAction, isPending] = useActionState(updateWorkLog, null);
  const [isDeleting, startDelete] = useTransition();

  const total = useMemo(
    () =>
      workLog.entries.reduce((acc, entry) => {
        const qty = Number(quantities[entry.id] ?? 0) || 0;
        return acc + Math.round(Number(entry.amountSnapshot) * 100) * qty;
      }, 0),
    [workLog.entries, quantities]
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={workLog.id} />
      <Card>
        <CardHeader>
          <CardTitle>Editar registro</CardTitle>
          <CardDescription>
            {workLog.routeName} · {workLog.companyName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Paquetes por tarifa</Label>
            <div className="space-y-2">
              {workLog.entries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3">
                  <input type="hidden" name="entryId" value={entry.id} />
                  <div className="flex-1">
                    <p className="text-sm">{entry.nameSnapshot}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(entry.amountSnapshot)} c/u (valor al
                      momento del registro)
                    </p>
                  </div>
                  <Input
                    name="entryQuantity"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={quantities[entry.id] ?? ""}
                    onChange={(e) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [entry.id]: e.target.value,
                      }))
                    }
                    className="w-24 text-right"
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <WorkLogCommonFields
            defaults={{
              date: workLog.date,
              miles: workLog.miles,
              note: workLog.note,
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
        <CardFooter className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total recalculado</p>
            <p className="text-xl font-bold">{formatCurrency(total / 100)}</p>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" className="text-destructive">
                  <Trash2 className="size-4" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará el registro y sus totales dejarán de contar en
                    el dashboard. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      startDelete(async () => {
                        await deleteWorkLog(workLog.id);
                        router.push("/registros");
                      })
                    }
                  >
                    {isDeleting ? "Eliminando…" : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
