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
import {
  WorkLogCreateForm,
  type RouteWithRates,
} from "@/components/worklogs/worklog-create-form";

export const metadata: Metadata = { title: "Nuevo registro" };

export default async function NewWorkLogPage() {
  const userId = await requireUserId();

  const routes = await prisma.route.findMany({
    where: {
      company: { userId },
      isActive: true,
      rateTypes: { some: { isActive: true } },
    },
    orderBy: [{ company: { isActive: "desc" } }, { createdAt: "desc" }],
    include: {
      company: { select: { name: true } },
      rateTypes: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (routes.length === 0) {
    // Regla 9: guiar al usuario a crear la ruta primero.
    return (
      <Card>
        <CardHeader>
          <CardTitle>Primero crea una ruta</CardTitle>
          <CardDescription>
            Para registrar tu trabajo necesitas una ruta con al menos una
            tarifa activa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/rutas/nueva">Crear mi primera ruta</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const routesForForm: RouteWithRates[] = routes.map((route) => ({
    id: route.id,
    name: route.name,
    companyName: route.company.name,
    rates: route.rateTypes.map((rate) => ({
      id: rate.id,
      name: rate.name,
      amount: rate.amount.toFixed(2),
    })),
  }));

  return (
    <div className="mx-auto max-w-xl">
      <WorkLogCreateForm routes={routesForForm} />
    </div>
  );
}
