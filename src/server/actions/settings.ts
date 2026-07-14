"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function updateWeekStartDay(weekStartDay: number) {
  const userId = await requireUserId();

  if (!Number.isInteger(weekStartDay) || weekStartDay < 0 || weekStartDay > 6) {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { weekStartDay },
  });

  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
}
