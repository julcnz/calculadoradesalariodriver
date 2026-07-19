import type { Metadata } from "next";
import Link from "next/link";
import { Coffee } from "lucide-react";
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
import { WeekStartSelect } from "@/components/settings/week-start-select";
import { GoalsForm } from "@/components/settings/goals-form";
import { MileageRateForm } from "@/components/settings/mileage-rate-form";
import { FuelSettingsForm } from "@/components/settings/fuel-settings-form";
import { FixedCostsForm } from "@/components/settings/fixed-costs-form";
import { ReminderSettings } from "@/components/settings/reminder-settings";
import { SharedWeeksList } from "@/components/settings/shared-weeks-list";
import { CompanyQuickAdd } from "@/components/settings/company-quick-add";
import { RouteQuickAdd } from "@/components/settings/route-quick-add";
import { addDays } from "@/lib/dates/week";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const userId = await requireUserId();

  const [user, goals, sharedWeeks, companies, routes] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        weekStartDay: true,
        mileageRate: true,
        vehicleMpg: true,
        fuelPricePerGallon: true,
        monthlyFixedCosts: true,
        reminderEnabled: true,
        reminderTime: true,
      },
    }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.sharedWeek.findMany({
      where: { userId, revokedAt: null },
      orderBy: { weekStart: "desc" },
      select: { id: true, weekStart: true, createdAt: true },
    }),
    prisma.company.findMany({
      where: { userId },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      select: { id: true, name: true, isActive: true },
    }),
    prisma.route.findMany({
      where: { company: { userId }, isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        company: { select: { name: true } },
        rateTypes: { where: { isActive: true }, select: { id: true } },
      },
    }),
  ]);

  const PREVIEW_LIMIT = 5;

  const goalAmount = (period: string) =>
    goals.find((g) => g.period === period)?.amount.toFixed(2) ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Ajusta la app a tu forma de trabajar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semana de pago</CardTitle>
          <CardDescription>
            Elige el día en que comienza tu semana de pago. Los totales y
            gráficos semanales respetarán esta configuración.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WeekStartSelect current={user.weekStartDay} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guía de inicio</CardTitle>
          <CardDescription>
            ¿Empezando o quieres repasar la configuración? La guía te lleva
            paso a paso y marca lo que ya tienes listo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/guia">Abrir la guía</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empresas</CardTitle>
          <CardDescription>
            Para quién trabajas. La activa es la que se preselecciona al crear
            rutas; el historial completo se conserva.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {companies.length > 0 ? (
            <ul className="space-y-1.5 text-sm">
              {companies.slice(0, PREVIEW_LIMIT).map((company) => (
                <li
                  key={company.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate">{company.name}</span>
                  {company.isActive && (
                    <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                      Activa
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no tienes empresas registradas.
            </p>
          )}
          {companies.length > PREVIEW_LIMIT && (
            <p className="text-xs text-muted-foreground">
              y {companies.length - PREVIEW_LIMIT} más…
            </p>
          )}
          <CompanyQuickAdd />
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/empresas">Administrar empresas →</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rutas y tarifas</CardTitle>
          <CardDescription>
            Tus rutas con lo que te pagan por paquete. Sin una ruta no puedes
            registrar el día.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {routes.length > 0 ? (
            <ul className="space-y-1.5 text-sm">
              {routes.slice(0, PREVIEW_LIMIT).map((route) => (
                <li
                  key={route.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate">{route.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {route.company.name} ·{" "}
                    {route.rateTypes.length === 1
                      ? "1 tarifa"
                      : `${route.rateTypes.length} tarifas`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no tienes rutas activas.
            </p>
          )}
          {routes.length > PREVIEW_LIMIT && (
            <p className="text-xs text-muted-foreground">
              y {routes.length - PREVIEW_LIMIT} más…
            </p>
          )}
          {companies.length > 0 ? (
            <RouteQuickAdd
              companies={companies.map(({ id, name }) => ({ id, name }))}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Primero agrega una empresa para poder crear rutas.
            </p>
          )}
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/rutas">Administrar rutas →</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metas de ganancias</CardTitle>
          <CardDescription>
            Define cuánto quieres ganar por período y sigue tu progreso en el
            dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoalsForm
            defaults={{
              daily: goalAmount("DAILY"),
              weekly: goalAmount("WEEKLY"),
              monthly: goalAmount("MONTHLY"),
              yearly: goalAmount("YEARLY"),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deducción por milla (impuestos)</CardTitle>
          <CardDescription>
            Cada milla registrada puede ser deducible de impuestos como
            contratista independiente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MileageRateForm current={user.mileageRate.toFixed(2)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Impuestos estimados</CardTitle>
          <CardDescription>
            Cuánto apartar cada trimestre como contratista independiente
            (1099), calculado con tus ingresos y millas reales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/impuestos">Ver mis impuestos</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehículo y combustible</CardTitle>
          <CardDescription>
            Rendimiento de tu vehículo y precio de la gasolina para estimar el
            costo de combustible de tus millas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FuelSettingsForm
            currentMpg={user.vehicleMpg?.toFixed(1) ?? ""}
            currentPrice={user.fuelPricePerGallon?.toFixed(2) ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recordatorio diario</CardTitle>
          <CardDescription>
            Una notificación a la hora que elijas, solo los días que aún no
            hayas registrado tu trabajo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReminderSettings
            enabled={user.reminderEnabled}
            time={user.reminderTime ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos fijos mensuales</CardTitle>
          <CardDescription>
            Lo que pagas cada mes trabajes o no. Con esto el dashboard te
            muestra tu punto de equilibrio en paquetes por día.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FixedCostsForm current={user.monthlyFixedCosts?.toFixed(2) ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Semanas compartidas</CardTitle>
          <CardDescription>
            Enlaces públicos de resumen que has creado. Cualquiera con el
            enlace puede ver los ingresos de esa semana.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SharedWeeksList
            items={sharedWeeks.map((week) => ({
              id: week.id,
              weekLabel: `Semana del ${formatDate(week.weekStart)} al ${formatDate(addDays(week.weekStart, 6))}`,
              createdLabel: formatDate(week.createdAt),
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cuenta</CardTitle>
          <CardDescription>
            Foto de perfil, datos personales y suspensión de cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Nombre: </span>
              {user.name ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Email: </span>
              {user.email}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/perfil">Editar perfil</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-2 pt-2 pb-4 text-sm text-muted-foreground">
        <p>Hecho por Julián</p>
        <a
          href="https://buymeacoffee.com/julcnzs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline"
        >
          <Coffee className="size-4" aria-hidden />
          Dóname un café
        </a>
      </div>
    </div>
  );
}
