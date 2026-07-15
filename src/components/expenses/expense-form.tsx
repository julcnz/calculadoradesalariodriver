"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  createExpense,
  deleteExpense,
  updateExpense,
} from "@/server/actions/expenses";
import {
  PREDEFINED_EXPENSE_CATEGORIES,
  OTHER_CATEGORY_OPTION,
} from "@/lib/expense-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
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
import { FieldError } from "@/components/auth/field-error";

export type ExpenseDefaults = {
  id?: string;
  date: string;
  amount: string;
  category: string; // nombre predefinido u OTHER_CATEGORY_OPTION
  customCategory: string;
  note: string;
};

function todayLocalISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function ExpenseForm({ defaults }: { defaults?: ExpenseDefaults }) {
  const isEdit = Boolean(defaults?.id);
  const router = useRouter();
  const [category, setCategory] = useState(defaults?.category ?? "");
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateExpense : createExpense,
    null
  );
  const [isDeleting, startDelete] = useTransition();

  const isOther = category === OTHER_CATEGORY_OPTION;

  return (
    <form action={formAction}>
      {isEdit && <input type="hidden" name="id" value={defaults!.id} />}
      <input type="hidden" name="category" value={category} />
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Editar gasto" : "Nuevo gasto"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-date">Fecha</Label>
            <Input
              id="expense-date"
              name="date"
              type="date"
              defaultValue={defaults?.date ?? todayLocalISO()}
              required
              className="w-fit"
            />
            <FieldError errors={state?.errors?.date} />
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elige una categoría" />
              </SelectTrigger>
              <SelectContent>
                {PREDEFINED_EXPENSE_CATEGORIES.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_CATEGORY_OPTION}>Otra…</SelectItem>
              </SelectContent>
            </Select>
            <FieldError errors={state?.errors?.category} />
          </div>

          {isOther && (
            <div className="space-y-2">
              <Label htmlFor="expense-custom">Nombre de la categoría</Label>
              <Input
                id="expense-custom"
                name="customCategory"
                placeholder="Ej. Multas, Accesorios…"
                defaultValue={defaults?.customCategory ?? ""}
                autoFocus
              />
              <FieldError errors={state?.errors?.customCategory} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="expense-amount">Monto</Label>
            <div className="relative w-40">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="expense-amount"
                name="amount"
                inputMode="decimal"
                placeholder="0.00"
                defaultValue={defaults?.amount ?? ""}
                className="pl-7"
              />
            </div>
            <FieldError errors={state?.errors?.amount} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-note">Nota (opcional)</Label>
            <Textarea
              id="expense-note"
              name="note"
              rows={2}
              placeholder="Ej. cambio de aceite, tanque lleno…"
              defaultValue={defaults?.note ?? ""}
            />
            <FieldError errors={state?.errors?.note} />
          </div>

          {state?.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
        </CardContent>
        <CardFooter className="mt-4 flex items-center justify-between gap-3">
          <Button type="submit" disabled={isPending || !category}>
            {isPending
              ? "Guardando…"
              : isEdit
                ? "Guardar cambios"
                : "Guardar gasto"}
          </Button>
          {isEdit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" className="text-destructive">
                  <Trash2 className="size-4" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar este gasto?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      startDelete(async () => {
                        await deleteExpense(defaults!.id!);
                        router.push("/gastos");
                      })
                    }
                  >
                    {isDeleting ? "Eliminando…" : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}
