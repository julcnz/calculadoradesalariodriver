import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MapPin, Package, Pencil, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCurrency, formatDate, formatMinutes } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination, PAGE_SIZE } from "@/components/filters/pagination";

export const metadata: Metadata = { title: "Registros" };

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none dark:bg-input/30";

export default async function WorkLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    ruta?: string;
    empresa?: string;
    desde?: string;
    hasta?: string;
    q?: string;
    pagina?: string;
  }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;

  const desde = params.desde && DATE_REGEX.test(params.desde) ? params.desde : undefined;
  const hasta = params.hasta && DATE_REGEX.test(params.hasta) ? params.hasta : undefined;
  const q = params.q?.trim() || undefined;
  const pagina = Math.max(1, Number(params.pagina) || 1);

  const [routes, companies] = await Promise.all([
    prisma.route.findMany({
      where: { company: { userId } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    prisma.company.findMany({
      where: { userId },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      select: { id: true, name: true },
    }),
  ]);

  const rutaId = routes.some((r) => r.id === params.ruta) ? params.ruta : undefined;
  const empresaId = companies.some((c) => c.id === params.empresa)
    ? params.empresa
    : undefined;
  const hasFilters = Boolean(rutaId || empresaId || desde || hasta || q);

  const where = {
    userId,
    ...(rutaId ? { routeId: rutaId } : {}),
    ...(empresaId ? { route: { companyId: empresaId } } : {}),
    ...(desde || hasta
      ? {
          date: {
            ...(desde ? { gte: new Date(desde) } : {}),
            ...(hasta ? { lte: new Date(hasta) } : {}),
          },
        }
      : {}),
    ...(q ? { note: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [total, workLogs] = await Promise.all([
    prisma.workLog.count({ where }),
    prisma.workLog.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (pagina - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        route: {
          select: { name: true, company: { select: { name: true } } },
        },
        entries: true,
      },
    }),
  ]);

  const filterParams = {
    ruta: rutaId,
    empresa: empresaId,
    desde,
    hasta,
    q,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registros</h1>
          <p className="text-sm text-muted-foreground">
            Tu trabajo día a día.
          </p>
        </div>
        {routes.length > 0 && (
          <Button asChild>
            <Link href="/registros/nuevo">
              <Plus className="size-4" />
              Nuevo registro
            </Link>
          </Button>
        )}
      </div>

      {routes.length === 0 ? (
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
      ) : (
        <>
          <form
            method="GET"
            className="flex flex-wrap items-center gap-2 rounded-lg border p-3"
          >
            <select name="ruta" defaultValue={rutaId ?? ""} className={selectClass}>
              <option value="">Todas las rutas</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
            {companies.length > 1 && (
              <select
                name="empresa"
                defaultValue={empresaId ?? ""}
                className={selectClass}
              >
                <option value="">Todas las empresas</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            )}
            <Input
              type="date"
              name="desde"
              defaultValue={desde}
              aria-label="Desde"
              className="w-fit"
            />
            <Input
              type="date"
              name="hasta"
              defaultValue={hasta}
              aria-label="Hasta"
              className="w-fit"
            />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Buscar en notas…"
              className="w-40"
            />
            <Button type="submit" variant="outline" size="sm">
              <Search className="size-4" />
              Filtrar
            </Button>
            {hasFilters && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/registros">Limpiar</Link>
              </Button>
            )}
          </form>

          {workLogs.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {hasFilters ? "Sin resultados" : "Aún no tienes registros"}
                </CardTitle>
                <CardDescription>
                  {hasFilters
                    ? "Ningún registro coincide con estos filtros."
                    : "Registra tu primer día de trabajo para empezar a ver tus ganancias."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasFilters ? (
                  <Button asChild variant="outline">
                    <Link href="/registros">Quitar filtros</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/registros/nuevo">
                      <Plus className="size-4" />
                      Registrar mi día
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
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
              <Pagination
                basePath="/registros"
                params={filterParams}
                pagina={pagina}
                total={total}
                label="registros"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
