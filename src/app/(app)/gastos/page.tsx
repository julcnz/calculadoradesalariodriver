import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Gastos" };

export default async function ExpensesPage() {
  const userId = await requireUserId();

  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: { category: { select: { name: true } } },
  });

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

      {expenses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aún no tienes gastos</CardTitle>
            <CardDescription>
              Registra gasolina, mantenimiento y demás para conocer tu
              ganancia neta real.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/gastos/nuevo">
                <Plus className="size-4" />
                Registrar mi primer gasto
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
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
                    <p className="truncate text-xs text-muted-foreground">
                      {expense.note}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <p className="text-base font-bold">
                    −{formatCurrency(expense.amount.toFixed(2))}
                  </p>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
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
      )}
    </div>
  );
}
