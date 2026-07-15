import { z } from "zod";
import { moneyStringSchema } from "@/lib/validations/route";
import {
  PREDEFINED_EXPENSE_CATEGORIES,
  OTHER_CATEGORY_OPTION,
} from "@/lib/expense-categories";

export const expenseSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
    amount: moneyStringSchema,
    category: z.string().min(1, "Elige una categoría"),
    customCategory: z
      .string()
      .trim()
      .max(100, "El nombre es demasiado largo")
      .optional()
      .or(z.literal("")),
    note: z.string().trim().max(500, "La nota es demasiado larga").optional(),
  })
  .refine(
    (data) =>
      data.category !== OTHER_CATEGORY_OPTION ||
      Boolean(data.customCategory && data.customCategory.length > 0),
    {
      message: "Escribe el nombre de la categoría",
      path: ["customCategory"],
    }
  )
  .refine(
    (data) =>
      data.category === OTHER_CATEGORY_OPTION ||
      (PREDEFINED_EXPENSE_CATEGORIES as readonly string[]).includes(
        data.category
      ),
    { message: "Categoría no válida", path: ["category"] }
  );

export type ExpenseInput = z.infer<typeof expenseSchema>;
