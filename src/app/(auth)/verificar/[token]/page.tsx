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

export const metadata: Metadata = { title: "Verificar email" };

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashVerificationToken(token) },
  });

  let verified = false;
  if (record && !record.usedAt && record.expiresAt > new Date()) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
    verified = true;
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>
          {verified ? "✅ Email verificado" : "El enlace no es válido"}
        </CardTitle>
        <CardDescription>
          {verified
            ? "Tu email quedó confirmado. ¡Gracias!"
            : "El enlace expiró o ya fue usado. Puedes pedir uno nuevo desde el aviso dentro de la app."}
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
