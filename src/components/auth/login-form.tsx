"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginUser } from "@/server/actions/auth";
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

export function LoginForm({ notice }: { notice?: string }) {
  const [state, formAction, isPending] = useActionState(loginUser, null);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>
          Ingresa con tu email y contraseña
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {notice && !state?.message && (
            <p className="rounded-md bg-muted p-3 text-sm">{notice}</p>
          )}
          {state?.message && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.message}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              required
            />
            <FieldError errors={state?.errors?.email} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link
                href="/recuperar"
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                ¿La olvidaste?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            <FieldError errors={state?.errors?.password} />
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Ingresando…" : "Ingresar"}
          </Button>
          <p className="text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-medium text-primary underline-offset-4 hover:underline">
              Regístrate
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
