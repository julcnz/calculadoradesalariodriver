import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RouteForm } from "@/components/routes/route-form";

export const metadata: Metadata = { title: "Nueva ruta" };

export default async function NewRoutePage() {
  const userId = await requireUserId();

  const companies = await prisma.company.findMany({
    where: { userId },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: { id: true, name: true, isActive: true },
  });

  if (companies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Primero crea una empresa</CardTitle>
          <CardDescription>
            Las rutas pertenecen a una empresa. Crea la tuya y vuelve aquí.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/empresas">Ir a Empresas</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <RouteForm companies={companies} />
    </div>
  );
}
