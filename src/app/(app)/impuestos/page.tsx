import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { todayForUser } from "@/lib/dates/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { irsQuartersForYear, computeTaxEstimate } from "@/lib/taxes";
import { TaxRateForm } from "@/components/taxes/tax-rate-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Impuestos" };

export default async function TaxesPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const userId = await requireUserId();
  const { ano } = await searchParams;

  const today = await todayForUser();
  const currentYear = today.getUTCFullYear();
  const parsedYear = Number(ano);
  const year =
    Number.isInteger(parsedYear) && parsedYear >= 2020 && parsedYear <= currentYear + 1
      ? parsedYear
      : currentYear;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { mileageRate: true, incomeTaxRate: true },
  });
  const mileageRateCents = Math.round(Number(user.mileageRate) * 100);
  const incomeTaxRatePct = Number(user.incomeTaxRate);

  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));
  const [logs, expenseAggregate] = await Promise.all([
    prisma.workLog.findMany({
      where: { userId, date: { gte: yearStart, lte: yearEnd } },
      select: { date: true, totalEarned: true, miles: true },
    }),
    prisma.expense.aggregate({
      where: { userId, date: { gte: yearStart, lte: yearEnd } },
      _sum: { amount: true },
    }),
  ]);
  const yearExpensesCents = Math.round(
    Number(expenseAggregate._sum.amount ?? 0) * 100
  );

  const quarters = irsQuartersForYear(year).map((quarter) => {
    const quarterLogs = logs.filter(
      (log) => log.date >= quarter.start && log.date <= quarter.end
    );
    const grossCents = quarterLogs.reduce(
      (acc, log) => acc + Math.round(Number(log.totalEarned) * 100),
      0
    );
    const milesTenths = quarterLogs.reduce(
      (acc, log) =>
        acc + (log.miles !== null ? Math.round(Number(log.miles) * 10) : 0),
      0
    );
    const mileageDeductionCents = Math.round(
      (milesTenths * mileageRateCents) / 10
    );
    return {
      ...quarter,
      milesTenths,
      estimate: computeTaxEstimate({
        grossCents,
        mileageDeductionCents,
        incomeTaxRatePct,
      }),
      isCurrent: today >= quarter.start && today <= quarter.end,
    };
  });

  // Anual: aquí sí aplica la regla de los $400 (es un umbral anual).
  const annual = computeTaxEstimate({
    grossCents: quarters.reduce((acc, q) => acc + q.estimate.grossCents, 0),
    mileageDeductionCents: quarters.reduce(
      (acc, q) => acc + q.estimate.mileageDeductionCents,
      0
    ),
    incomeTaxRatePct,
    applyAnnualMinimum: true,
  });
  const annualMilesTenths = quarters.reduce((acc, q) => acc + q.milesTenths, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Impuestos</h1>
          <p className="text-sm text-muted-foreground">
            Cuánto apartar como contratista independiente (1099). Es una
            estimación, no asesoría fiscal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="icon" aria-label="Año anterior">
            <Link href={`/impuestos?ano=${year - 1}`}>
              <ChevronLeft />
            </Link>
          </Button>
          <span className="min-w-14 text-center text-sm font-semibold tabular-nums">
            {year}
          </span>
          <Button
            asChild
            variant="outline"
            size="icon"
            aria-label="Año siguiente"
            disabled={year >= currentYear + 1}
          >
            <Link href={`/impuestos?ano=${year + 1}`}>
              <ChevronRight />
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total estimado a apartar en {year}</CardDescription>
          <CardTitle className="text-3xl">
            {formatCurrency(annual.totalCents / 100)}
          </CardTitle>
          {annual.effectivePct !== null && (
            <CardDescription>
              ≈{annual.effectivePct}% de tus ingresos brutos
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-1 text-xs text-muted-foreground">
          <p>
            Ingresos brutos: {formatCurrency(annual.grossCents / 100)} ·
            Deducción por milla: −
            {formatCurrency(annual.mileageDeductionCents / 100)} (
            {(annualMilesTenths / 10).toFixed(1)} mi × $
            {(mileageRateCents / 100).toFixed(2)})
          </p>
          <p>
            Autoempleo: {formatCurrency(annual.seTaxCents / 100)} · Ingreso (
            {incomeTaxRatePct}%): {formatCurrency(annual.incomeTaxCents / 100)}
          </p>
          <p>
            Al cierre del año, tus 1099 deberían sumar cerca de los ingresos
            brutos de arriba — si no cuadran, te falta registrar días.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {quarters.map((quarter) => (
          <Card
            key={quarter.index}
            className={cn(quarter.isCurrent && "border-foreground/40")}
          >
            <CardHeader className="pb-2">
              <CardDescription>
                {quarter.label} · {quarter.months}
                {quarter.isCurrent && (
                  <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                    en curso
                  </span>
                )}
              </CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(quarter.estimate.totalCents / 100)}
              </CardTitle>
              <CardDescription>
                pago estimado: {formatDate(quarter.dueDate)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              {quarter.estimate.grossCents === 0 ? (
                <p>Sin ingresos registrados en este trimestre.</p>
              ) : (
                <>
                  <p>
                    Ingresos: {formatCurrency(quarter.estimate.grossCents / 100)}{" "}
                    · Millas: −
                    {formatCurrency(
                      quarter.estimate.mileageDeductionCents / 100
                    )}{" "}
                    ({(quarter.milesTenths / 10).toFixed(1)} mi)
                  </p>
                  <p>
                    Base fiscal:{" "}
                    {formatCurrency(quarter.estimate.taxableBaseCents / 100)}
                  </p>
                  <p>
                    Autoempleo (15.3%):{" "}
                    {formatCurrency(quarter.estimate.seTaxCents / 100)} ·
                    Ingreso ({incomeTaxRatePct}%):{" "}
                    {formatCurrency(quarter.estimate.incomeTaxCents / 100)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tu tasa de impuesto sobre ingreso</CardTitle>
          <CardDescription>
            El impuesto de autoempleo es fijo (15.3%); el de ingreso depende de
            tu situación personal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaxRateForm current={Number(user.incomeTaxRate).toFixed(1)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cómo se calcula</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Base fiscal = ingresos brutos − deducción por milla del IRS. Tus
            gastos registrados ({formatCurrency(yearExpensesCents / 100)} en{" "}
            {year}) no se restan aquí: la deducción por milla ya cubre los
            costos del vehículo (gasolina, mantenimiento, seguro), y restarlos
            también los contaría dos veces. Si tienes gastos grandes que no son
            del vehículo, tu impuesto real puede ser menor.
          </p>
          <p>
            Autoempleo (Social Security + Medicare): 15.3% sobre el 92.35% de
            la base. Si tu ganancia neta anual queda debajo de $400, no aplica.
            Impuesto sobre ingreso: tu tasa efectiva sobre la base menos la
            mitad del autoempleo (esa mitad es deducible).
          </p>
          <p>
            Los trimestres del IRS no son trimestres calendario (el 2do es
            abril–mayo y el 3ro junio–agosto) y los pagos estimados vencen el
            15 del mes siguiente al cierre. Verifica montos y fechas con el
            IRS o tu preparador — esta página solo te ayuda a apartar dinero a
            tiempo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
