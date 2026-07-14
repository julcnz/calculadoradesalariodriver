"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteRoute, updateRouteName } from "@/server/actions/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function RouteNameForm({
  routeId,
  name,
}: {
  routeId: string;
  name: string;
}) {
  const [state, formAction, isPending] = useActionState(updateRouteName, null);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={routeId} />
      <Label htmlFor="route-name">Nombre de la ruta</Label>
      <div className="flex items-center gap-2">
        <Input id="route-name" name="name" defaultValue={name} className="flex-1" />
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "…" : "Guardar"}
        </Button>
      </div>
      <FieldError errors={state?.errors?.name} />
    </form>
  );
}

export function RouteDeleteButton({ routeId }: { routeId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="text-destructive">
            <Trash2 className="size-4" />
            Eliminar ruta
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta ruta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán también sus tarifas. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteRoute(routeId);
                  if (result.error) {
                    setError(result.error);
                  } else {
                    router.push("/rutas");
                  }
                })
              }
            >
              {isPending ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
