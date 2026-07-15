"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/server/actions/password-reset";
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
import { FieldError } from "@/components/auth/field-error";

export function RecoverForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    null
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>¿Olvidaste tu contraseña?</CardTitle>
        <CardDescription>
          Te enviaremos un enlace para elegir una nueva.
        </CardDescription>
      </CardHeader>
      {state?.success ? (
        <CardContent>
          <p className="rounded-md bg-muted p-3 text-sm">
            Si existe una cuenta con ese email, en unos minutos recibirás un
            enlace para restablecer tu contraseña. Revisa también la carpeta
            de spam.
          </p>
        </CardContent>
      ) : (
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recover-email">Email</Label>
              <Input
                id="recover-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                required
              />
              <FieldError errors={state?.errors?.email} />
            </div>
          </CardContent>
          <CardFooter className="mt-6 flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Enviando…" : "Enviar enlace"}
            </Button>
          </CardFooter>
        </form>
      )}
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Volver a iniciar sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
