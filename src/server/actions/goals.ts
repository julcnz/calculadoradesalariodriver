"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { goalsSchema } from "@/lib/validations/goal";
import type { GoalPeriod } from "@/generated/prisma/enums";

export type GoalsFormState = {
  errors?: Record<string, string[]>;
  success?: boolean;
} | null;

const FIELD_TO_PERIOD: Record<keyof z.infer<typeof goalsSchema>, GoalPeriod> = {
  daily: "DAILY",
  weekly: "WEEKLY",
  monthly: "MONTHLY",
  yearly: "YEARLY",
};

export async function saveGoals(
  _prevState: GoalsFormState,
  formData: FormData
): Promise<GoalsFormState> {
  const userId = await requireUserId();

  const parsed = goalsSchema.safeParse({
    daily: formData.get("daily") ?? "",
    weekly: formData.get("weekly") ?? "",
    monthly: formData.get("monthly") ?? "",
    yearly: formData.get("yearly") ?? "",
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  for (const [field, period] of Object.entries(FIELD_TO_PERIOD) as [
    keyof typeof FIELD_TO_PERIOD,
    GoalPeriod,
  ][]) {
    const amount = parsed.data[field];
    const existing = await prisma.goal.findFirst({
      where: { userId, period },
    });

    if (!amount) {
      if (existing) await prisma.goal.delete({ where: { id: existing.id } });
      continue;
    }
    if (existing) {
      await prisma.goal.update({
        where: { id: existing.id },
        data: { amount, isActive: true },
      });
    } else {
      await prisma.goal.create({
        data: { userId, period, amount, isActive: true },
      });
    }
  }

  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
  return { success: true };
}
