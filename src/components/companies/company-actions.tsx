"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Trash2, Archive } from "lucide-react";
import {
  deleteCompany,
  finishCompany,
  setActiveCompany,
} from "@/server/actions/companies";
import { Button } from "@/components/ui/button";
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

export function CompanyActions({
  companyId,
  isActive,
}: {
  companyId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isActive && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => setActiveCompany(companyId))}
        >
          <CheckCircle2 className="size-4" />
          Usar como actual
        </Button>
      )}
      {isActive && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => finishCompany(companyId))}
        >
          <Archive className="size-4" />
          Finalizar
        </Button>
      )}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive">
            <Trash2 className="size-4" />
            Eliminar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán también sus rutas y tarifas. Esta acción no se
              puede deshacer. Si trabajaste con ella, mejor usa
              &quot;Finalizar&quot; para conservar el historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteCompany(companyId);
                  setError(result.error ?? null);
                })
              }
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </div>
  );
}
