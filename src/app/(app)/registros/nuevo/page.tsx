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
  type WorkLogInitialValues,
} from "@/components/worklogs/worklog-create-form";
import { todayForUser } from "@/lib/dates/server";

export const metadata: Metadata = { title: "Nuevo registro" };

export default async function NewWorkLogPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string }>;
}) {
  const userId = await requireUserId();
  const { desde } = await searchParams;

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

  // "Repetir ayer" (?desde=ultimo): precarga ruta, cantidades y horas del
  // último registro anterior a hoy. La fecha queda en hoy y el total se
  // calcula con las tarifas vigentes, no con los snapshots del original.
  let initial: WorkLogInitialValues | undefined;
  if (desde === "ultimo") {
    const today = await todayForUser();
    const lastLog = await prisma.workLog.findFirst({
      where: { userId, date: { lt: today } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: {
        routeId: true,
        startTime: true,
        endTime: true,
        entries: { select: { rateTypeId: true, quantity: true } },
      },
    });
    const sourceRoute = lastLog
      ? routes.find((route) => route.id === lastLog.routeId)
      : undefined;
    if (lastLog && sourceRoute) {
      const activeRateIds = new Set(sourceRoute.rateTypes.map((r) => r.id));
      initial = {
        routeId: sourceRoute.id,
        quantities: Object.fromEntries(
          lastLog.entries
            .filter(
              (entry) =>
                entry.rateTypeId !== null &&
                entry.quantity > 0 &&
                activeRateIds.has(entry.rateTypeId)
            )
            .map((entry) => [entry.rateTypeId as string, String(entry.quantity)])
        ),
        startTime: lastLog.startTime ?? "",
        endTime: lastLog.endTime ?? "",
      };
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <WorkLogCreateForm routes={routesForForm} initial={initial} />
    </div>
  );
}
