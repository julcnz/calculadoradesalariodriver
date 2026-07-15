import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { OTHER_CATEGORY_OPTION, PREDEFINED_EXPENSE_CATEGORIES } from "@/lib/expense-categories";
import { ExpenseForm } from "@/components/expenses/expense-form";

export const metadata: Metadata = { title: "Editar gasto" };

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;

  const expense = await prisma.expense.findFirst({
    where: { id, userId },
    include: { category: true },
  });
  if (!expense) notFound();

  const categoryName = expense.category?.name ?? "";
  const isPredefined = (
    PREDEFINED_EXPENSE_CATEGORIES as readonly string[]
  ).includes(categoryName);

  return (
    <div className="mx-auto max-w-xl">
      <ExpenseForm
        defaults={{
          id: expense.id,
          date: expense.date.toISOString().slice(0, 10),
          amount: expense.amount.toFixed(2),
          category: isPredefined ? categoryName : OTHER_CATEGORY_OPTION,
          customCategory: isPredefined ? "" : categoryName,
          note: expense.note ?? "",
        }}
      />
    </div>
  );
}
