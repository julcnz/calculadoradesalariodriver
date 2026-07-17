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

export type FuelSettingsState = {
  error?: string;
  success?: boolean;
} | null;

// Config de combustible: mpg del vehículo y precio por galón. Ambos vacíos
// significa "sin configurar" (null en BD, regla 2) y apaga la estimación.
export async function updateFuelSettings(
  _prevState: FuelSettingsState,
  formData: FormData
): Promise<FuelSettingsState> {
  const userId = await requireUserId();

  const rawMpg = String(formData.get("vehicleMpg") ?? "").trim().replace(",", ".");
  const rawPrice = String(formData.get("fuelPricePerGallon") ?? "")
    .trim()
    .replace(",", ".");

  if (rawMpg === "" && rawPrice === "") {
    await prisma.user.update({
      where: { id: userId },
      data: { vehicleMpg: null, fuelPricePerGallon: null },
    });
    revalidatePath("/configuracion");
    revalidatePath("/dashboard");
    return { success: true };
  }

  if (!/^\d{1,2}(\.\d)?$/.test(rawMpg) || Number(rawMpg) <= 0) {
    return { error: "Ingresa un rendimiento válido entre 0.1 y 99.9 mpg (ej. 22)" };
  }
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(rawPrice) || Number(rawPrice) <= 0) {
    return { error: "Ingresa un precio válido entre 0.01 y 99.99 $/galón (ej. 3.45)" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { vehicleMpg: rawMpg, fuelPricePerGallon: rawPrice },
  });

  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
  return { success: true };
}

export type FixedCostsState = {
  error?: string;
  success?: boolean;
} | null;

// Gastos fijos mensuales (renta, seguro, teléfono…) para el punto de
// equilibrio. Vacío = sin configurar (null, regla 2) y oculta la tarjeta.
export async function updateMonthlyFixedCosts(
  _prevState: FixedCostsState,
  formData: FormData
): Promise<FixedCostsState> {
  const userId = await requireUserId();

  const raw = String(formData.get("monthlyFixedCosts") ?? "")
    .trim()
    .replace(",", ".");

  if (raw === "") {
    await prisma.user.update({
      where: { id: userId },
      data: { monthlyFixedCosts: null },
    });
    revalidatePath("/configuracion");
    revalidatePath("/dashboard");
    return { success: true };
  }

  if (!/^\d{1,8}(\.\d{1,2})?$/.test(raw) || Number(raw) <= 0) {
    return { error: "Ingresa un monto mensual válido (ej. 850 o 850.50)" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { monthlyFixedCosts: raw },
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
