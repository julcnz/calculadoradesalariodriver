import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashVerificationToken } from "@/lib/email-verification";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VerifyEmailConfirm } from "@/components/auth/verify-email-confirm";

export const metadata: Metadata = { title: "Verificar email" };

// Esta página SOLO consulta; el token se consume con el botón (POST).
// Así los escáneres de enlaces de los correos no lo gastan por accidente.
export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashVerificationToken(token) },
    include: { user: { select: { emailVerifiedAt: true } } },
  });

  if (record?.user.emailVerifiedAt) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>✅ Email ya verificado</CardTitle>
          <CardDescription>
            Este email ya estaba confirmado. Todo en orden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/dashboard">Ir a la app</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>El enlace no es válido</CardTitle>
          <CardDescription>
            El enlace expiró, ya fue usado o llegó incompleto. Pide uno nuevo
            desde el aviso dentro de la app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/dashboard">Ir a la app</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <VerifyEmailConfirm token={token} />;
}
