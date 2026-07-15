import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import {
  getPeriodRange,
  isPeriodType,
  WEEKDAYS_ES,
  type PeriodType,
} from "@/lib/dates/week";
import { todayForUser } from "@/lib/dates/server";
import { formatCurrency, formatMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GoalPeriod } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompanyFilter } from "@/components/dashboard/company-filter";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import {
  RouteEarningsChart,
  type RouteEarningsDatum,
} from "@/components/dashboard/route-earnings-chart";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string; periodo?: string; fecha?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;

  const periodo: PeriodType =
    params.periodo && isPeriodType(params.periodo) ? params.periodo : "semana";
  // "Hoy" en la zona horaria del navegador del usuario (cookie tz).
  const today = await todayForUser();
  const date =
    params.fecha && /^\d{4}-\d{2}-\d{2}$/.test(params.fecha)
      ? new Date(params.fecha)
      : today;

  const [user, companies] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { weekStartDay: true },
    }),
    prisma.company.findMany({
      where: { userId },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      select: { id: true, name: true },
    }),
  ]);

  const companyId = companies.some((c) => c.id === params.empresa)
    ? params.empresa
    : undefined;

  const { start, end } = getPeriodRange(periodo, date, user.weekStartDay);

  const [logs, expenses] = await Promise.all([
    prisma.workLog.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
        ...(companyId ? { route: { companyId } } : {}),
      },
      include: {
        route: { select: { name: true } },
        entries: { select: { quantity: true } },
      },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: start, lte: end } },
      select: { amount: true },
    }),
  ]);

  const incomeCents = logs.reduce(
    (acc, log) => acc + Math.round(Number(log.totalEarned) * 100),
    0
  );
  const packages = logs.reduce(
    (acc, log) =>
      acc + log.entries.reduce((sum, entry) => sum + entry.quantity, 0),
    0
  );
  const daysWorked = new Set(logs.map((log) => log.date.toISOString())).size;
  const expenseCents = expenses.reduce(
    (acc, expense) => acc + Math.round(Number(expense.amount) * 100),
    0
  );
  const netCents = incomeCents - expenseCents;

  // Meta del período seleccionado (el trimestre no tiene meta propia).
  const GOAL_BY_PERIOD: Partial<Record<PeriodType, GoalPeriod>> = {
    dia: "DAILY",
    semana: "WEEKLY",
    mes: "MONTHLY",
    ano: "YEARLY",
  };
  const goalPeriod = GOAL_BY_PERIOD[periodo];
  const goal = goalPeriod
    ? await prisma.goal.findFirst({
        where: { userId, period: goalPeriod, isActive: true },
      })
    : null;
  const goalCents = goal ? Math.round(Number(goal.amount) * 100) : null;
  const goalPct =
    goalCents && goalCents > 0
      ? Math.min(100, Math.round((incomeCents / goalCents) * 100))
      : null;

  // Promedios $/hora y $/milla — regla 2: solo cuentan los registros que SÍ
  // tienen horas/millas; los demás no contaminan el promedio.
  const logsWithMinutes = logs.filter((log) => log.workedMinutes !== null);
  const totalMinutes = logsWithMinutes.reduce(
    (acc, log) => acc + (log.workedMinutes ?? 0),
    0
  );
  const incomeCentsWithMinutes = logsWithMinutes.reduce(
    (acc, log) => acc + Math.round(Number(log.totalEarned) * 100),
    0
  );
  const perHourCents =
    totalMinutes > 0
      ? Math.round(incomeCentsWithMinutes / (totalMinutes / 60))
      : null;

  const logsWithMiles = logs.filter((log) => log.miles !== null);
  const totalMilesTenths = logsWithMiles.reduce(
    (acc, log) => acc + Math.round(Number(log.miles) * 10),
    0
  );
  const incomeCentsWithMiles = logsWithMiles.reduce(
    (acc, log) => acc + Math.round(Number(log.totalEarned) * 100),
    0
  );
  const perMileCents =
    totalMilesTenths > 0
      ? Math.round(incomeCentsWithMiles / (totalMilesTenths / 10))
      : null;

  // Gráfico: ganancias por ruta dentro del período.
  const byRoute = new Map<string, { total: number; dates: Set<string> }>();
  for (const log of logs) {
    const entry = byRoute.get(log.route.name) ?? {
      total: 0,
      dates: new Set<string>(),
    };
    entry.total += Math.round(Number(log.totalEarned) * 100);
    entry.dates.add(log.date.toISOString().slice(0, 10));
    byRoute.set(log.route.name, entry);
  }
  const chartData: RouteEarningsDatum[] = [...byRoute.entries()]
    .map(([route, { total, dates }]) => ({
      route,
      total: total / 100,
      days: dates.size,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Semana de {WEEKDAYS_ES[user.weekStartDay]} a{" "}
            {WEEKDAYS_ES[(user.weekStartDay + 6) % 7]} ·{" "}
            <Link
              href="/configuracion"
              className="underline-offset-4 hover:underline"
            >
              cambiar
            </Link>
          </p>
        </div>
        {companies.length > 1 && (
          <CompanyFilter companies={companies} selected={companyId} />
        )}
      </div>

      <PeriodSelector
        periodo={periodo}
        date={date}
        today={today}
        weekStartDay={user.weekStartDay}
        empresa={companyId}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ingresos</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(incomeCents / 100)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>
              {packages} paquetes ·{" "}
              {daysWorked === 1
                ? "1 día trabajado"
                : `${daysWorked} días trabajados`}
            </p>
            {goalCents !== null && goalPct !== null && (
              <div className="space-y-1">
                <Progress value={goalPct} aria-label="Progreso de la meta" />
                <p>
                  Meta: {formatCurrency(goalCents / 100)} · {goalPct}%
                  {goalPct >= 100 && " 🎉"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gastos</CardDescription>
            <CardTitle className="text-2xl">
              −{formatCurrency(expenseCents / 100)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <p>
              {expenses.length === 1
                ? "1 gasto registrado"
                : `${expenses.length} gastos registrados`}
            </p>
            {companyId && (
              <p>Los gastos no se filtran por empresa.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ganancia neta</CardDescription>
            <CardTitle
              className={cn(
                "text-2xl",
                netCents < 0 && "text-destructive"
              )}
            >
              {formatCurrency(netCents / 100)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <p>
              {incomeCents > 0
                ? `Margen: ${Math.round((netCents / incomeCents) * 100)}%`
                : "Ingresos − gastos del período"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Promedios</CardDescription>
            <CardTitle className="text-2xl">
              {perHourCents !== null
                ? `${formatCurrency(perHourCents / 100)}/h`
                : "—/h"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            <p>
              {perMileCents !== null
                ? `${formatCurrency(perMileCents / 100)}/milla`
                : "—/milla (sin millas registradas)"}
            </p>
            <p>
              {totalMinutes > 0
                ? formatMinutes(totalMinutes)
                : "Horas no registradas"}
              {totalMilesTenths > 0 && ` · ${totalMilesTenths / 10} mi`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ganancias por ruta</CardTitle>
          <CardDescription>
            Pasa el cursor sobre una barra para ver el detalle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-start gap-3 py-4">
              <p className="text-sm text-muted-foreground">
                No hay registros en este período.
              </p>
              <Button asChild size="sm">
                <Link href="/registros/nuevo">
                  <Plus className="size-4" />
                  Nuevo registro
                </Link>
              </Button>
            </div>
          ) : (
            <RouteEarningsChart data={chartData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
