import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WeekStartSelect } from "@/components/settings/week-start-select";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const userId = await requireUserId();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, name: true, weekStartDay: true },
  });

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
          <CardTitle>Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Nombre: </span>
            {user.name ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Email: </span>
            {user.email}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
