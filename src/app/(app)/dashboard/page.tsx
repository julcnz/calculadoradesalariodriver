import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  todayAsBusinessDate,
  WEEKDAYS_ES,
} from "@/lib/dates/week";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompanyFilter } from "@/components/dashboard/company-filter";
import {
  RouteEarningsChart,
  type RouteEarningsDatum,
} from "@/components/dashboard/route-earnings-chart";

export const metadata: Metadata = { title: "Dashboard" };

type LogForStats = {
  date: Date;
  totalEarned: { toString(): string };
  route: { name: string };
  entries: { quantity: number }[];
};

function sumStats(logs: LogForStats[], from: Date, to: Date) {
  const inRange = logs.filter((log) => log.date >= from && log.date <= to);
  const total = inRange.reduce(
    (acc, log) => acc + Math.round(Number(log.totalEarned) * 100),
    0
  );
  const packages = inRange.reduce(
    (acc, log) =>
      acc + log.entries.reduce((sum, entry) => sum + entry.quantity, 0),
    0
  );
  return { total: total / 100, packages, days: inRange.length };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string }>;
}) {
  const userId = await requireUserId();
  const { empresa } = await searchParams;

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

  const companyId = companies.some((c) => c.id === empresa)
    ? empresa
    : undefined;

  const today = todayAsBusinessDate();
  const weekStart = startOfWeek(today, user.weekStartDay);
  const weekEnd = endOfWeek(today, user.weekStartDay);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // La semana personalizada puede desbordar el mes: traemos el rango que cubre ambos.
  const rangeStart = weekStart < monthStart ? weekStart : monthStart;
  const rangeEnd = weekEnd > monthEnd ? weekEnd : monthEnd;

  const logs = await prisma.workLog.findMany({
    where: {
      userId,
      date: { gte: rangeStart, lte: rangeEnd },
      ...(companyId ? { route: { companyId } } : {}),
    },
    include: {
      route: { select: { name: true } },
      entries: { select: { quantity: true } },
    },
  });

  const dayStats = sumStats(logs, today, today);
  const weekStats = sumStats(logs, weekStart, weekEnd);
  const monthStats = sumStats(logs, monthStart, monthEnd);

  // Gráfico: ganancias por ruta en el mes actual.
  const monthLogs = logs.filter(
    (log) => log.date >= monthStart && log.date <= monthEnd
  );
  const byRoute = new Map<string, { total: number; dates: Set<string> }>();
  for (const log of monthLogs) {
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

  const monthName = new Intl.DateTimeFormat("es", {
    month: "long",
    timeZone: "UTC",
  }).format(today);

  const cards = [
    { label: "Hoy", sub: formatDate(today), stats: dayStats },
    {
      label: "Esta semana",
      sub: `${formatDate(weekStart)} – ${formatDate(weekEnd)}`,
      stats: weekStats,
    },
    {
      label: "Este mes",
      sub: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      stats: monthStats,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Semana de {WEEKDAYS_ES[user.weekStartDay]} a{" "}
            {WEEKDAYS_ES[(user.weekStartDay + 6) % 7]} ·{" "}
            <Link href="/configuracion" className="underline-offset-4 hover:underline">
              cambiar
            </Link>
          </p>
        </div>
        {companies.length > 1 && (
          <CompanyFilter companies={companies} selected={companyId} />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(card.stats.total)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              <p>{card.sub}</p>
              <p>
                {card.stats.packages} paquetes ·{" "}
                {card.stats.days === 1
                  ? "1 día trabajado"
                  : `${card.stats.days} días trabajados`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Ganancias por ruta — este mes
          </CardTitle>
          <CardDescription>
            Pasa el cursor sobre una barra para ver el detalle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-start gap-3 py-4">
              <p className="text-sm text-muted-foreground">
                Aún no hay registros este mes. Registra tu primer día para ver
                el gráfico.
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
