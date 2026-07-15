"use client";

import { useTransition } from "react";
import { PauseCircle } from "lucide-react";
import { suspendAccount } from "@/server/actions/profile";
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

export function SuspendAccountButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-destructive">
          <PauseCircle className="size-4" />
          Suspender cuenta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Suspender tu cuenta?</AlertDialogTitle>
          <AlertDialogDescription>
            Tu sesión se cerrará en todos los dispositivos y la cuenta quedará
            pausada. No se borra ningún dato: tus registros, rutas y empresas
            seguirán aquí. Para reactivarla, simplemente vuelve a iniciar
            sesión.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => startTransition(() => suspendAccount())}
          >
            {isPending ? "Suspendiendo…" : "Suspender"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
