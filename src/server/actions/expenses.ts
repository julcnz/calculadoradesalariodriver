"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { expenseSchema } from "@/lib/validations/expense";
import { OTHER_CATEGORY_OPTION } from "@/lib/expense-categories";

export type ExpenseFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | null;

type ParsedExpense = z.infer<typeof expenseSchema>;

// Devuelve el id de la categoría a usar y el texto libre original (si aplica).
// Predefinidas: fila global (userId null), se crea si aún no existe.
// "Otra": categoría propia del usuario; el texto crudo se conserva tal cual
// en Expense.originalFreeText (regla 6).
async function resolveCategory(
  userId: string,
  data: ParsedExpense,
  rawCustomText: string
): Promise<{ categoryId: string; originalFreeText: string | null }> {
  if (data.category !== OTHER_CATEGORY_OPTION) {
    const existing = await prisma.expenseCategory.findFirst({
      where: { userId: null, name: data.category },
    });
    const category =
      existing ??
      (await prisma.expenseCategory.create({
        data: { userId: null, name: data.category, isCustom: false },
      }));
    return { categoryId: category.id, originalFreeText: null };
  }

  const name = data.customCategory as string;
  const existing = await prisma.expenseCategory.findFirst({
    where: { userId, name },
  });
  const category =
    existing ??
    (await prisma.expenseCategory.create({
      data: { userId, name, isCustom: true },
    }));
  return { categoryId: category.id, originalFreeText: rawCustomText };
}

function parseExpenseForm(formData: FormData) {
  return expenseSchema.safeParse({
    date: formData.get("date"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    customCategory: formData.get("customCategory") ?? "",
    note: formData.get("note") ?? "",
  });
}

export async function createExpense(
  _prevState: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const userId = await requireUserId();

  const rawCustomText = String(formData.get("customCategory") ?? "");
  const parsed = parseExpenseForm(formData);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { categoryId, originalFreeText } = await resolveCategory(
    userId,
    parsed.data,
    rawCustomText
  );

  await prisma.expense.create({
    data: {
      userId,
      categoryId,
      originalFreeText,
      amount: parsed.data.amount,
      date: new Date(parsed.data.date),
      note: parsed.data.note || null,
    },
  });

  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  redirect("/gastos");
}

export async function updateExpense(
  _prevState: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const userId = await requireUserId();
  const expenseId = String(formData.get("id") ?? "");

  const rawCustomText = String(formData.get("customCategory") ?? "");
  const parsed = parseExpenseForm(formData);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });
  if (!expense) return { message: "El gasto no existe" };

  const { categoryId, originalFreeText } = await resolveCategory(
    userId,
    parsed.data,
    rawCustomText
  );

  await prisma.expense.update({
    where: { id: expense.id },
    data: {
      categoryId,
      originalFreeText,
      amount: parsed.data.amount,
      date: new Date(parsed.data.date),
      note: parsed.data.note || null,
    },
  });

  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  redirect("/gastos");
}

export async function deleteExpense(expenseId: string) {
  const userId = await requireUserId();

  await prisma.expense.deleteMany({ where: { id: expenseId, userId } });

  revalidatePath("/gastos");
  revalidatePath("/dashboard");
}
