"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export type MileageRateState = {
  error?: string;
  success?: boolean;
} | null;

// Tarifa de deducción por milla (estilo IRS). Se guarda en $/milla.
export async function updateMileageRate(
  _prevState: MileageRateState,
  formData: FormData
): Promise<MileageRateState> {
  const userId = await requireUserId();

  const raw = String(formData.get("mileageRate") ?? "").trim().replace(",", ".");
  if (!/^\d(\.\d{1,2})?$/.test(raw) || Number(raw) <= 0) {
    return { error: "Ingresa una tarifa válida entre 0.01 y 9.99 (ej. 0.70)" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { mileageRate: raw },
  });

  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
  return { success: true };
}

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
