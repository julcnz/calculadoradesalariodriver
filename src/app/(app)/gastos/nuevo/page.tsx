import type { Metadata } from "next";
import { ExpenseForm } from "@/components/expenses/expense-form";

export const metadata: Metadata = { title: "Nuevo gasto" };

export default function NewExpensePage() {
  return (
    <div className="mx-auto max-w-xl">
      <ExpenseForm />
    </div>
  );
}
