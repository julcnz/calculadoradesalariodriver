"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "@/server/actions/password-reset";
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

export function ResetForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(resetPassword, null);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Nueva contraseña</CardTitle>
        <CardDescription>
          Elige la contraseña con la que entrarás a partir de ahora.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <input type="hidden" name="token" value={token} />
        <CardContent className="space-y-4">
          {state?.message && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.message}{" "}
              <Link href="/recuperar" className="font-medium underline underline-offset-4">
                Solicitar enlace nuevo
              </Link>
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="reset-password">Nueva contraseña</Label>
            <Input
              id="reset-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres, una mayúscula y un número.
            </p>
            <FieldError errors={state?.errors?.password} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-confirm">Confirmar contraseña</Label>
            <Input
              id="reset-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
            />
            <FieldError errors={state?.errors?.confirmPassword} />
          </div>
        </CardContent>
        <CardFooter className="mt-6">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar contraseña"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
