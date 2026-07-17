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

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const userId = await requireUserId();

  const [user, goals] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        weekStartDay: true,
        mileageRate: true,
      },
    }),
    prisma.goal.findMany({ where: { userId } }),
  ]);

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
