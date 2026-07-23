import type { Metadata } from "next";
import Link from "next/link";
import { Plus, RotateCcw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import {
  addDays,
  endOfMonth,
  getPeriodRange,
  isPeriodType,
  shiftPeriod,
  startOfWeek,
  toDateParam,
  type PeriodType,
} from "@/lib/dates/week";
import { currentHourForUser, todayForUser } from "@/lib/dates/server";
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
import {
  computeAverages,
  computeAvgMilesTenthsPerDay,
  computeWeekdayPerformance,
  type HistoryLogLite,
} from "@/lib/metrics";
import { ActivityCalendar } from "@/components/dashboard/activity-calendar";
import { WeekdayPerformanceTable } from "@/components/dashboard/weekday-performance";
import { ShareButton } from "@/components/dashboard/share-button";
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
  // "Hoy" y la hora local en la zona del navegador del usuario (cookie tz).
  const today = await todayForUser();
  const hour = await currentHourForUser();
  const date =
    params.fecha && /^\d{4}-\d{2}-\d{2}$/.test(params.fecha)
      ? new Date(params.fecha)
      : today;

  const [user, companies] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        name: true,
        weekStartDay: true,
        mileageRate: true,
        vehicleMpg: true,
        fuelPricePerGallon: true,
        monthlyFixedCosts: true,
      },
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

  const [logs, expenses, prevAggregate, prevExpenseAggregate, historyLogs] =
    await Promise.all([
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
      // Período anterior, para la comparativa de ingresos.
      prisma.workLog.aggregate({
        where: {
          userId,
          date: { gte: prevRange.start, lte: prevRange.end },
          ...companyWhere,
        },
        _sum: { totalEarned: true },
      }),
      // Gastos del período anterior (no se filtran por empresa, como los del
      // período actual), para la comparativa de gastos.
      prisma.expense.aggregate({
        where: {
          userId,
          date: { gte: prevRange.start, lte: prevRange.end },
        },
        _sum: { amount: true },
      }),
      // Historial completo (ligero) para racha y récords; los campos extra
      // alimentan la ventana de 12 semanas (rendimiento por día, equilibrio).
      // Si el volumen crece, separar la ventana en una query con date >= gte.
      prisma.workLog.findMany({
        where: { userId, ...companyWhere },
        select: {
          date: true,
          totalEarned: true,
          workedMinutes: true,
          miles: true,
          entries: { select: { quantity: true } },
        },
      }),
    ]);

  // Ventana histórica de 12 semanas (alineada a la semana personalizada).
  const historyWindowStart = addDays(
    startOfWeek(today, user.weekStartDay),
    -77
  );
  const recentHistory: HistoryLogLite[] = historyLogs
    .filter((log) => log.date >= historyWindowStart)
    .map((log) => ({
      date: log.date,
      totalEarnedCents: Math.round(Number(log.totalEarned) * 100),
      workedMinutes: log.workedMinutes,
      packages: log.entries.reduce((sum, entry) => sum + entry.quantity, 0),
      milesTenths:
        log.miles !== null ? Math.round(Number(log.miles) * 10) : null,
    }));
  const weekdayRows = computeWeekdayPerformance(recentHistory);

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

  // Combustible estimado del período: millas ÷ mpg × precio/galón. Solo
  // informativo (no altera el neto) y solo con millas y config completas.
  // Aritmética entera: (mi/10) ÷ (mpg/10) × priceCents = mi × priceCents / mpg.
  const mpgTenths = user.vehicleMpg
    ? Math.round(Number(user.vehicleMpg) * 10)
    : 0;
  const fuelPriceCents = user.fuelPricePerGallon
    ? Math.round(Number(user.fuelPricePerGallon) * 100)
    : 0;
  const fuelCents =
    totalMilesTenths > 0 && mpgTenths > 0 && fuelPriceCents > 0
      ? Math.round((totalMilesTenths * fuelPriceCents) / mpgTenths)
      : null;

  // Punto de equilibrio: paquetes/día para cubrir los gastos fijos. Usa el
  // mes de HOY (no el del período navegado): es una cifra diaria estable.
  const histAverages = computeAverages(recentHistory);
  const breakeven = (() => {
    if (user.monthlyFixedCosts === null) return null;
    const fixedCents = Math.round(Number(user.monthlyFixedCosts) * 100);
    const daysInMonth = endOfMonth(today).getUTCDate();
    const dailyFixedCents = Math.round(fixedCents / daysInMonth);
    const avgMilesTenths = computeAvgMilesTenthsPerDay(recentHistory);
    const fuelPerDayCents =
      avgMilesTenths !== null && mpgTenths > 0 && fuelPriceCents > 0
        ? Math.round((avgMilesTenths * fuelPriceCents) / mpgTenths)
        : 0;
    const dailyCostCents = dailyFixedCents + fuelPerDayCents;
    return {
      dailyFixedCents,
      fuelPerDayCents,
      dailyCostCents,
      // Math.ceil: mejor prometer un paquete de más que quedarse corto.
      packagesNeeded: histAverages.perPackageCents
        ? Math.ceil(dailyCostCents / histAverages.perPackageCents)
        : null,
    };
  })();

  // Comparativa con el período anterior (ingresos y gastos).
  const prevCents = Math.round(
    Number(prevAggregate._sum.totalEarned ?? 0) * 100
  );
  const changePct =
    prevCents > 0
      ? Math.round(((incomeCents - prevCents) / prevCents) * 100)
      : null;
  const prevExpenseCents = Math.round(
    Number(prevExpenseAggregate._sum.amount ?? 0) * 100
  );
  const expenseChangePct =
    prevExpenseCents > 0
      ? Math.round(((expenseCents - prevExpenseCents) / prevExpenseCents) * 100)
      : null;

  // Proyección: solo para el período EN CURSO (no aplica al día).
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const isCurrentPeriod = today >= start && today <= end;
  const totalDays =
    Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  const elapsedDays =
    Math.round((today.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  const projectionCents =
    isCurrentPeriod &&
    periodo !== "dia" &&
    incomeCents > 0 &&
    elapsedDays < totalDays
      ? Math.round((incomeCents * totalDays) / elapsedDays)
      : null;

  // Meta inversa: cuánto falta por día (y en paquetes, con el $/paquete de
  // las últimas 12 semanas) para alcanzar la meta del período EN CURSO.
  // Math.ceil en ambas: mejor pedir un poco de más que quedarse corto.
  const goalGap = (() => {
    if (goalCents === null || goalCents <= 0) return null;
    if (!isCurrentPeriod || periodo === "dia") return null;
    const remainingCents = goalCents - incomeCents;
    if (remainingCents <= 0) return null;
    const remainingDays = totalDays - elapsedDays + 1; // incluye hoy
    if (remainingDays <= 0) return null;
    const perDayCents = Math.ceil(remainingCents / remainingDays);
    return {
      remainingDays,
      perDayCents,
      packagesPerDay: histAverages.perPackageCents
        ? Math.ceil(perDayCents / histAverages.perPackageCents)
        : null,
    };
  })();

  // Racha: días consecutivos trabajados terminando hoy (o ayer).
  const workedDates = new Set(historyLogs.map((log) => toDateParam(log.date)));
  let streak = 0;
  let cursor = workedDates.has(toDateParam(today)) ? today : addDays(today, -1);
  while (workedDates.has(toDateParam(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  // "Repetir ayer": atajo que precarga el registro de hoy con el último día
  // trabajado. Solo si hoy aún no hay registro y existe uno anterior.
  const todayParam = toDateParam(today);
  const lastWorkedParam =
    [...workedDates]
      .filter((d) => d < todayParam)
      .sort()
      .at(-1) ?? null;
  const showRepeatLast =
    !workedDates.has(todayParam) && lastWorkedParam !== null;
  const repeatLabel =
    lastWorkedParam === toDateParam(addDays(today, -1))
      ? "Repetir ayer"
      : "Repetir último día";

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
      (byCategory.get(name) ?? 0) + Math.round(Number(expense.amount) * 100)
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

  // Saludo según la hora local del usuario + su primer nombre.
  const greeting =
    hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
  const firstName = user.name?.trim().split(/\s+/)[0] ?? null;

  // "vs …" en la comparativa: el período anterior según el seleccionado.
  const PREV_PERIOD_LABEL: Record<PeriodType, string> = {
    dia: "vs día anterior",
    semana: "vs semana anterior",
    mes: "vs mes anterior",
    trimestre: "vs trimestre anterior",
    ano: "vs año anterior",
  };

  // Rótulo de la meta según el período seleccionado.
  const META_LABEL: Record<PeriodType, string> = {
    dia: "Meta del día",
    semana: "Meta de la semana",
    mes: "Meta del mes",
    trimestre: "Meta del trimestre",
    ano: "Meta del año",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            {greeting}
            {firstName ? ` ${firstName}` : ""}
            <br />
            ¡Bienvenido a tu dashboard!
          </h1>
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
        actions={
          <div className="ml-auto flex items-center gap-2">
            {showRepeatLast && (
              <Button asChild size="sm" variant="outline">
                <Link href="/registros/nuevo?desde=ultimo">
                  <RotateCcw /> {repeatLabel}
                </Link>
              </Button>
            )}
            <ShareButton periodo={periodo} fecha={toDateParam(date)} />
          </div>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">Ingresos</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(incomeCents / 100)}
            </p>
            <div className="text-footnote text-muted-foreground space-y-1">
              <p>{packages} paquetes</p>
              <p>
                {daysWorked === 1
                  ? "1 día trabajado"
                  : `${daysWorked} días trabajados`}
              </p>
              {changePct !== null && (
                <p className="text-foreground font-medium">
                  {changePct >= 0 ? "▲" : "▼"} {changePct >= 0 ? "+" : ""}
                  {changePct}% {PREV_PERIOD_LABEL[periodo]}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2 border-l pl-4">
            <p className="text-muted-foreground text-sm">Gastos</p>
            <p className="text-2xl font-semibold tabular-nums">
              −{formatCurrency(expenseCents / 100)}
            </p>
            <div className="text-footnote text-muted-foreground space-y-1">
              <p>
                {expenses.length === 1
                  ? "1 gasto registrado"
                  : `${expenses.length} gastos registrados`}
              </p>
              {expenseChangePct !== null && (
                <p className="text-foreground font-medium">
                  {expenseChangePct >= 0 ? "▲" : "▼"}{" "}
                  {expenseChangePct >= 0 ? "+" : ""}
                  {expenseChangePct}% {PREV_PERIOD_LABEL[periodo]}
                </p>
              )}
              {companyId && <p>Los gastos no se filtran por empresa.</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">Ganancia neta</p>
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums",
                netCents < 0 && "text-destructive"
              )}
            >
              {formatCurrency(netCents / 100)}
            </p>
            <div className="text-footnote text-muted-foreground space-y-1">
              <p>
                {incomeCents > 0
                  ? `Margen: ${Math.round((netCents / incomeCents) * 100)}%`
                  : "Ingresos − gastos del período"}
              </p>
            </div>
          </div>
          <div className="space-y-2 border-l pl-4">
            <p className="text-muted-foreground text-sm">
              {META_LABEL[periodo]}
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {goalPct !== null
                ? `${goalPct}%`
                : projectionCents !== null
                  ? `~${formatCurrency(projectionCents / 100)}`
                  : "—"}
            </p>
            <div className="text-footnote text-muted-foreground space-y-2">
              {goalCents !== null && goalPct !== null && (
                <>
                  <Progress value={goalPct} aria-label="Progreso de la meta" />
                  <p>
                    Meta: {formatCurrency(goalCents / 100)} · {goalPct}%
                    {goalPct >= 100 && " 🎉"}
                  </p>
                </>
              )}
              {projectionCents !== null && (
                <p>
                  Proyección del período: ~
                  {formatCurrency(projectionCents / 100)}
                </p>
              )}
              {goalGap !== null && (
                <p>
                  Para llegar: ~{formatCurrency(goalGap.perDayCents / 100)}/día
                  {goalGap.packagesPerDay !== null &&
                    ` (≈${goalGap.packagesPerDay} paquetes/día)`}
                  {goalGap.remainingDays === 1
                    ? " hoy"
                    : ` los ${goalGap.remainingDays} días que quedan`}
                </p>
              )}
              {goalCents === null && projectionCents === null && (
                <p>
                  {goalPeriod ? (
                    <>
                      Aún no defines una meta. Configúrala en{" "}
                      <Link
                        href="/configuracion"
                        className="underline-offset-4 hover:underline"
                      >
                        Ajustes
                      </Link>
                      .
                    </>
                  ) : (
                    "El trimestre no tiene meta propia."
                  )}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Promedios</CardDescription>
          <CardTitle className="text-2xl tabular-nums">
            {perHourCents !== null
              ? `${formatCurrency(perHourCents / 100)}/h`
              : "—/h"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-footnote text-muted-foreground space-y-1">
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
            <p className="text-foreground font-medium">
              🧾 Deducción est.: {formatCurrency(deductionCents / 100)} (
              {formatCurrency(mileageRateCents / 100)}/mi)
            </p>
          )}
          {fuelCents !== null && (
            <p className="text-foreground font-medium">
              ⛽ Combustible est.: {formatCurrency(fuelCents / 100)}
            </p>
          )}
        </CardContent>
      </Card>

      {breakeven && (
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Punto de equilibrio</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {breakeven.packagesNeeded !== null
                ? `~${breakeven.packagesNeeded} paquetes/día`
                : "Faltan datos"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-footnote text-muted-foreground">
            {breakeven.packagesNeeded !== null ? (
              <p>
                Para cubrir {formatCurrency(breakeven.dailyCostCents / 100)}{" "}
                diarios ({formatCurrency(breakeven.dailyFixedCents / 100)} de
                gastos fijos
                {breakeven.fuelPerDayCents > 0 &&
                  ` + ${formatCurrency(breakeven.fuelPerDayCents / 100)} de gasolina estimada`}
                ) con tu promedio histórico de{" "}
                {formatCurrency((histAverages.perPackageCents ?? 0) / 100)}
                /paquete.
              </p>
            ) : (
              <p>
                Registra días con paquetes para conocer tu $/paquete histórico y
                calcular cuántos necesitas al día.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {recentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rendimiento por día</CardTitle>
            <CardDescription>
              Qué día de la semana te rinde más · últimas 12 semanas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeekdayPerformanceTable rows={weekdayRows} />
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
                <p className="text-muted-foreground text-sm">
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
            <CardDescription>
              En qué se va el dinero del período.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <p className="text-muted-foreground py-4 text-sm">
                No hay gastos en este período.
              </p>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map((category) => (
                  <div key={category.name} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{category.name}</span>
                      <span className="text-muted-foreground shrink-0">
                        {formatCurrency(category.cents / 100)} · {category.pct}%
                      </span>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-chart-3 h-full rounded-full"
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
