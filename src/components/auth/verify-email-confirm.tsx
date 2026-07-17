"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { confirmEmailVerification } from "@/server/actions/email-verification";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function VerifyEmailConfirm({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  if (status === "ok") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>✅ Email verificado</CardTitle>
          <CardDescription>Tu email quedó confirmado. ¡Gracias!</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/dashboard">Ir a la app</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Verifica tu email</CardTitle>
        <CardDescription>
          Presiona el botón para confirmar que este email es tuyo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === "error" && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            El enlace expiró o ya fue usado. Pide uno nuevo desde el aviso
            dentro de la app.
          </p>
        )}
        <Button
          type="button"
          className="w-full"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await confirmEmailVerification(token);
              setStatus(result.ok ? "ok" : "error");
            })
          }
        >
          {isPending ? "Verificando…" : "Confirmar mi email"}
        </Button>
      </CardContent>
    </Card>
  );
}
