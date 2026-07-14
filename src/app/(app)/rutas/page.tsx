import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Rutas" };

export default async function RoutesPage() {
  const userId = await requireUserId();

  const [companiesCount, routes] = await Promise.all([
    prisma.company.count({ where: { userId } }),
    prisma.route.findMany({
      where: { company: { userId } },
      orderBy: [{ createdAt: "desc" }],
      include: {
        company: { select: { name: true, isActive: true } },
        rateTypes: { orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rutas</h1>
          <p className="text-sm text-muted-foreground">
            Cada ruta tiene sus propias tarifas por paquete.
          </p>
        </div>
        {companiesCount > 0 && (
          <Button asChild>
            <Link href="/rutas/nueva">
              <Plus className="size-4" />
              Nueva ruta
            </Link>
          </Button>
        )}
      </div>

      {companiesCount === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Primero crea una empresa</CardTitle>
            <CardDescription>
              Las rutas pertenecen a una empresa. Crea la tuya y vuelve aquí
              para definir tus rutas y tarifas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/empresas">Ir a Empresas</Link>
            </Button>
          </CardContent>
        </Card>
      ) : routes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aún no tienes rutas</CardTitle>
            <CardDescription>
              Crea tu primera ruta con sus tarifas para poder registrar tu
              trabajo diario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/rutas/nueva">
                <Plus className="size-4" />
                Crear mi primera ruta
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {routes.map((route) => (
            <Card key={route.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{route.name}</CardTitle>
                    <CardDescription>{route.company.name}</CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="icon" aria-label="Editar ruta">
                    <Link href={`/rutas/${route.id}/editar`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {route.rateTypes.map((rate) => (
                  <div
                    key={rate.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span
                      className={
                        rate.isActive ? "" : "text-muted-foreground line-through"
                      }
                    >
                      {rate.name}
                    </span>
                    <Badge variant="outline">
                      {formatCurrency(rate.amount.toString())}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
