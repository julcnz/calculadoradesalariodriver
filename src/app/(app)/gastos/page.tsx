import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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

export const metadata: Metadata = { title: "Gastos" };

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none dark:bg-input/30";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    categoria?: string;
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

  // Categorías que el usuario ha usado en sus gastos.
  const categories = await prisma.expenseCategory.findMany({
    where: { expenses: { some: { userId } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const categoriaId = categories.some((c) => c.id === params.categoria)
    ? params.categoria
    : undefined;
  const hasFilters = Boolean(categoriaId || desde || hasta || q);

  const where = {
    userId,
    ...(categoriaId ? { categoryId: categoriaId } : {}),
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

  const [total, expenses, totalAggregate] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (pagina - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { category: { select: { name: true } } },
    }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ]);

  const filteredTotal = Number(totalAggregate._sum.amount ?? 0);
  const filterParams = { categoria: categoriaId, desde, hasta, q };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
          <p className="text-sm text-muted-foreground">
            Lo que gastas para poder trabajar.
          </p>
        </div>
        <Button asChild>
          <Link href="/gastos/nuevo">
            <Plus className="size-4" />
            Nuevo gasto
          </Link>
        </Button>
      </div>

      {categories.length > 0 && (
        <form method="GET" className="space-y-3 rounded-lg border p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Categoría
              </span>
              <select
                name="categoria"
                defaultValue={categoriaId ?? ""}
                className={cn(selectClass, "w-full")}
              >
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Desde
              </span>
              <Input type="date" name="desde" defaultValue={desde} />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Hasta
              </span>
              <Input type="date" name="hasta" defaultValue={hasta} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Buscar en notas…"
              aria-label="Buscar en notas"
              className="min-w-0 flex-1 sm:max-w-56"
            />
            <Button type="submit" variant="outline">
              <Search className="size-4" />
              Filtrar
            </Button>
            {hasFilters && (
              <Button asChild variant="ghost">
                <Link href="/gastos">Limpiar</Link>
              </Button>
            )}
          </div>
        </form>
      )}

      {expenses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {hasFilters ? "Sin resultados" : "Aún no tienes gastos"}
            </CardTitle>
            <CardDescription>
              {hasFilters
                ? "Ningún gasto coincide con estos filtros."
                : "Registra gasolina, mantenimiento y demás para conocer tu ganancia neta real."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasFilters ? (
              <Button asChild variant="outline">
                <Link href="/gastos">Quitar filtros</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/gastos/nuevo">
                  <Plus className="size-4" />
                  Registrar mi primer gasto
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {hasFilters && (
            <p className="text-sm text-muted-foreground">
              Total filtrado:{" "}
              <span className="font-semibold text-foreground">
                −{formatCurrency(filteredTotal)}
              </span>
            </p>
          )}
          <div className="space-y-3">
            {expenses.map((expense) => (
              <Card key={expense.id}>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">
                        {formatDate(expense.date)}
                      </p>
                      <Badge variant="secondary">
                        {expense.category?.name ?? "Sin categoría"}
                      </Badge>
                    </div>
                    {expense.note && (
                      <p className="truncate text-footnote text-muted-foreground">
                        {expense.note}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <p className="text-base font-bold tabular-nums">
                      −{formatCurrency(expense.amount.toFixed(2))}
                    </p>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="-my-2 -mr-3 size-11"
                      aria-label="Editar gasto"
                    >
                      <Link href={`/gastos/${expense.id}/editar`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination
            basePath="/gastos"
            params={filterParams}
            pagina={pagina}
            total={total}
            label="gastos"
          />
        </>
      )}
    </div>
  );
}
