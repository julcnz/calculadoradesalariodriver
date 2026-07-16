import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import {
  addDays,
  getPeriodRange,
  isPeriodType,
  shiftPeriod,
  startOfWeek,
  toDateParam,
  WEEKDAYS_ES,
  type PeriodType,
} from "@/lib/dates/week";
import { todayForUser } from "@/lib/dates/server";
import { formatCurrency, formatDate, formatMinutes } from "@/lib/format";
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
import { ActivityCalendar } from "@/components/dashboard/activity-calendar";
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
      select: { weekStartDay: true, mileageRate: true },
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

  const companyWhere = companyId ? { route: { companyId } } : {};
  const prevRange = getPeriodRange(
    periodo,
    shiftPeriod(periodo, date, -1),
    user.weekStartDay
  );

  const [logs, expenses, prevAggregate, historyLogs] = await Promise.all([
    prisma.workLog.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
        ...companyWhere,
      },
      include: {
        route: { select: { name: true } },
        entries: { select: { quantity: true } },
      },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: start, lte: end } },
      select: { amount: true, category: { select: { name: true } } },
    }),
    // Período anterior, para la comparativa.
    prisma.workLog.aggregate({
      where: {
        userId,
        date: { gte: prevRange.start, lte: prevRange.end },
        ...companyWhere,
      },
      _sum: { totalEarned: true },
    }),
    // Historial completo (ligero) para racha y récords.
    prisma.workLog.findMany({
      where: { userId, ...companyWhere },
      select: { date: true, totalEarned: true },
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

  // Deducción estimada de impuestos: millas registradas × tarifa por milla.
  const mileageRateCents = Math.round(Number(user.mileageRate) * 100);
  const deductionCents =
    totalMilesTenths > 0
      ? Math.round((totalMilesTenths * mileageRateCents) / 10)
      : null;

  // Comparativa con el período anterior.
  const prevCents = Math.round(
    Number(prevAggregate._sum.totalEarned ?? 0) * 100
  );
  const changePct =
    prevCents > 0
      ? Math.round(((incomeCents - prevCents) / prevCents) * 100)
      : null;

  // Proyección: solo para el período EN CURSO (no aplica al día).
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const isCurrentPeriod = today >= start && today <= end;
  const totalDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  const elapsedDays = Math.round((today.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  const projectionCents =
    isCurrentPeriod && periodo !== "dia" && incomeCents > 0 && elapsedDays < totalDays
      ? Math.round((incomeCents * totalDays) / elapsedDays)
      : null;

  // Racha: días consecutivos trabajados terminando hoy (o ayer).
  const workedDates = new Set(
    historyLogs.map((log) => toDateParam(log.date))
  );
  let streak = 0;
  let cursor = workedDates.has(toDateParam(today)) ? today : addDays(today, -1);
  while (workedDates.has(toDateParam(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  // Récords históricos (respetan el filtro de empresa activo).
  const byDay = new Map<string, number>();
  const byWeek = new Map<string, number>();
  for (const log of historyLogs) {
    const cents = Math.round(Number(log.totalEarned) * 100);
    const dayKey = toDateParam(log.date);
    byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + cents);
    const weekKey = toDateParam(startOfWeek(log.date, user.weekStartDay));
    byWeek.set(weekKey, (byWeek.get(weekKey) ?? 0) + cents);
  }
  const bestDay = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  const bestWeek = [...byWeek.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  // Desglose de gastos por categoría.
  const byCategory = new Map<string, number>();
  for (const expense of expenses) {
    const name = expense.category?.name ?? "Sin categoría";
    byCategory.set(
      name,
      (byCategory.get(name) ?? 0) +
        Math.round(Number(expense.amount) * 100)
    );
  }
  const categoryBreakdown = [...byCategory.entries()]
    .map(([name, cents]) => ({
      name,
      cents,
      pct: expenseCents > 0 ? Math.round((cents / expenseCents) * 100) : 0,
    }))
    .sort((a, b) => b.cents - a.cents);

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
            {changePct !== null && (
              <p className="font-medium text-foreground">
                {changePct >= 0 ? "▲" : "▼"} {changePct >= 0 ? "+" : ""}
                {changePct}% vs período anterior
              </p>
            )}
            {projectionCents !== null && (
              <p>
                Proyección del período: ~
                {formatCurrency(projectionCents / 100)}
              </p>
            )}
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
            {deductionCents !== null && (
              <p className="font-medium text-foreground">
                🧾 Deducción est.: {formatCurrency(deductionCents / 100)} (
                {formatCurrency(mileageRateCents / 100)}/mi)
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {historyLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Constancia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ActivityCalendar
              byDay={byDay}
              today={today}
              weekStartDay={user.weekStartDay}
            />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span>
              🔥 Racha:{" "}
              <span className="font-semibold">
                {streak === 1 ? "1 día" : `${streak} días`}
              </span>
            </span>
            {bestDay && (
              <span>
                💪 Mejor día:{" "}
                <span className="font-semibold">
                  {formatCurrency(bestDay[1] / 100)}
                </span>{" "}
                <span className="text-muted-foreground">
                  ({formatDate(new Date(bestDay[0]))})
                </span>
              </span>
            )}
            {bestWeek && (
              <span>
                🏆 Mejor semana:{" "}
                <span className="font-semibold">
                  {formatCurrency(bestWeek[1] / 100)}
                </span>{" "}
                <span className="text-muted-foreground">
                  (del {formatDate(new Date(bestWeek[0]))})
                </span>
              </span>
            )}
          </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos por categoría</CardTitle>
            <CardDescription>En qué se va el dinero del período.</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No hay gastos en este período.
              </p>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map((category) => (
                  <div key={category.name} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{category.name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {formatCurrency(category.cents / 100)} · {category.pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-chart-3"
                        style={{ width: `${category.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
