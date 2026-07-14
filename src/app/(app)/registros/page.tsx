import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MapPin, Package, Pencil, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import {
  formatCurrency,
  formatDate,
  formatMinutes,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Registros" };

export default async function WorkLogsPage() {
  const userId = await requireUserId();

  const [routesCount, workLogs] = await Promise.all([
    prisma.route.count({ where: { company: { userId } } }),
    prisma.workLog.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        route: {
          select: { name: true, company: { select: { name: true } } },
        },
        entries: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registros</h1>
          <p className="text-sm text-muted-foreground">
            Tu trabajo día a día.
          </p>
        </div>
        {routesCount > 0 && (
          <Button asChild>
            <Link href="/registros/nuevo">
              <Plus className="size-4" />
              Nuevo registro
            </Link>
          </Button>
        )}
      </div>

      {routesCount === 0 ? (
        // Regla 9: no se puede registrar trabajo sin al menos una ruta.
        <Card>
          <CardHeader>
            <CardTitle>Primero crea una ruta</CardTitle>
            <CardDescription>
              Para registrar tu trabajo necesitas una ruta con sus tarifas.
              Solo te tomará un minuto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/rutas/nueva">Crear mi primera ruta</Link>
            </Button>
          </CardContent>
        </Card>
      ) : workLogs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aún no tienes registros</CardTitle>
            <CardDescription>
              Registra tu primer día de trabajo para empezar a ver tus
              ganancias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/registros/nuevo">
                <Plus className="size-4" />
                Registrar mi día
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workLogs.map((log) => {
            const packages = log.entries.reduce(
              (acc, entry) => acc + entry.quantity,
              0
            );
            return (
              <Card key={log.id}>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium">
                      {formatDate(log.date)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {log.route.name} · {log.route.company.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Package className="size-3.5" />
                        {packages} paq.
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {log.workedMinutes !== null
                          ? formatMinutes(log.workedMinutes)
                          : "No registrado"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {log.miles !== null
                          ? `${Number(log.miles)} mi`
                          : "No registrado"}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-base font-bold">
                      {formatCurrency(log.totalEarned.toFixed(2))}
                    </p>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      aria-label="Editar registro"
                    >
                      <Link href={`/registros/${log.id}/editar`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
