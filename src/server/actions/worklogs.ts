"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { calculateWorkedMinutes } from "@/lib/dates/time";
import {
  createWorkLogSchema,
  updateWorkLogSchema,
} from "@/lib/validations/worklog";

export type WorkLogFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | null;

// Multiplica un monto decimal (string) por una cantidad usando centavos,
// para evitar errores de coma flotante.
function multiplyAmount(amount: string, quantity: number): string {
  const cents = Math.round(Number(amount) * 100);
  return ((cents * quantity) / 100).toFixed(2);
}

function sumAmounts(amounts: string[]): string {
  const totalCents = amounts.reduce(
    (acc, amount) => acc + Math.round(Number(amount) * 100),
    0
  );
  return (totalCents / 100).toFixed(2);
}

function parseQuantitiesFromForm(formData: FormData) {
  const ids = formData.getAll("rateTypeId");
  const quantities = formData.getAll("quantity");
  return ids.map((id, i) => ({
    rateTypeId: String(id),
    quantity: Number(quantities[i] ?? 0) || 0,
  }));
}

// Regla 2: cadenas vacías → null (nunca 0 por defecto).
function emptyToNull(value: string | undefined): string | null {
  return value ? value : null;
}

// Con odómetro completo, las millas se calculan (fin − inicio, en décimas
// para evitar coma flotante); si no, se usan las millas manuales.
function resolveMiles(data: {
  miles?: string;
  odometerStart?: string;
  odometerEnd?: string;
}): { miles: string | null; odometerStart: string | null; odometerEnd: string | null } {
  if (data.odometerStart && data.odometerEnd) {
    const tenths =
      Math.round(Number(data.odometerEnd) * 10) -
      Math.round(Number(data.odometerStart) * 10);
    return {
      miles: (tenths / 10).toFixed(1),
      odometerStart: data.odometerStart,
      odometerEnd: data.odometerEnd,
    };
  }
  return {
    miles: emptyToNull(data.miles),
    odometerStart: null,
    odometerEnd: null,
  };
}

export async function createWorkLog(
  _prevState: WorkLogFormState,
  formData: FormData
): Promise<WorkLogFormState> {
  const userId = await requireUserId();

  const parsed = createWorkLogSchema.safeParse({
    routeId: formData.get("routeId"),
    date: formData.get("date"),
    startTime: formData.get("startTime") ?? "",
    endTime: formData.get("endTime") ?? "",
    miles: formData.get("miles") ?? "",
    odometerStart: formData.get("odometerStart") ?? "",
    odometerEnd: formData.get("odometerEnd") ?? "",
    note: formData.get("note") ?? "",
    quantities: parseQuantitiesFromForm(formData),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const data = parsed.data;

  const route = await prisma.route.findFirst({
    where: { id: data.routeId, company: { userId } },
    include: { rateTypes: { where: { isActive: true } } },
  });
  if (!route) return { message: "La ruta no existe" };

  const startTime = emptyToNull(data.startTime);
  const endTime = emptyToNull(data.endTime);
  const workedMinutes =
    startTime && endTime ? calculateWorkedMinutes(startTime, endTime) : null;

  // Regla 1: snapshot del nombre y valor de cada tarifa al momento del registro.
  const entries = data.quantities
    .filter((q) => q.quantity > 0)
    .map((q) => {
      const rateType = route.rateTypes.find((r) => r.id === q.rateTypeId);
      if (!rateType) return null;
      const amountSnapshot = rateType.amount.toFixed(2);
      return {
        rateTypeId: rateType.id,
        nameSnapshot: rateType.name,
        amountSnapshot,
        quantity: q.quantity,
        subtotal: multiplyAmount(amountSnapshot, q.quantity),
      };
    })
    .filter((entry) => entry !== null);

  if (entries.length === 0) {
    return { message: "Registra al menos un paquete en alguna tarifa" };
  }

  const totalEarned = sumAmounts(entries.map((e) => e.subtotal));

  const milesData = resolveMiles(data);

  await prisma.workLog.create({
    data: {
      userId,
      routeId: route.id,
      date: new Date(data.date),
      startTime,
      endTime,
      workedMinutes,
      miles: milesData.miles,
      odometerStart: milesData.odometerStart,
      odometerEnd: milesData.odometerEnd,
      note: emptyToNull(data.note),
      totalEarned,
      entries: { create: entries },
    },
  });

  revalidatePath("/registros");
  revalidatePath("/dashboard");
  redirect("/registros");
}

function parseEntriesFromForm(formData: FormData) {
  const ids = formData.getAll("entryId");
  const quantities = formData.getAll("entryQuantity");
  return ids.map((id, i) => ({
    entryId: String(id),
    quantity: Number(quantities[i] ?? 0) || 0,
  }));
}

// Regla 5: los registros pasados se pueden editar y los totales se recalculan.
// Los subtotales usan SIEMPRE el snapshot original de la tarifa (regla 1).
export async function updateWorkLog(
  _prevState: WorkLogFormState,
  formData: FormData
): Promise<WorkLogFormState> {
  const userId = await requireUserId();

  const parsed = updateWorkLogSchema.safeParse({
    id: formData.get("id"),
    date: formData.get("date"),
    startTime: formData.get("startTime") ?? "",
    endTime: formData.get("endTime") ?? "",
    miles: formData.get("miles") ?? "",
    odometerStart: formData.get("odometerStart") ?? "",
    odometerEnd: formData.get("odometerEnd") ?? "",
    note: formData.get("note") ?? "",
    entries: parseEntriesFromForm(formData),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const data = parsed.data;

  const workLog = await prisma.workLog.findFirst({
    where: { id: data.id, userId },
    include: { entries: true },
  });
  if (!workLog) return { message: "El registro no existe" };

  const startTime = emptyToNull(data.startTime);
  const endTime = emptyToNull(data.endTime);
  const workedMinutes =
    startTime && endTime ? calculateWorkedMinutes(startTime, endTime) : null;

  const updates = workLog.entries.map((entry) => {
    const submitted = data.entries.find((e) => e.entryId === entry.id);
    const quantity = submitted?.quantity ?? entry.quantity;
    return {
      id: entry.id,
      quantity,
      subtotal: multiplyAmount(entry.amountSnapshot.toFixed(2), quantity),
    };
  });

  if (!updates.some((u) => u.quantity > 0)) {
    return { message: "Registra al menos un paquete en alguna tarifa" };
  }

  const totalEarned = sumAmounts(updates.map((u) => u.subtotal));

  await prisma.$transaction([
    ...updates.map((u) =>
      prisma.workLogEntry.update({
        where: { id: u.id },
        data: { quantity: u.quantity, subtotal: u.subtotal },
      })
    ),
    prisma.workLog.update({
      where: { id: workLog.id },
      data: {
        date: new Date(data.date),
        startTime,
        endTime,
        workedMinutes,
        ...resolveMiles(data),
        note: emptyToNull(data.note),
        totalEarned,
      },
    }),
  ]);

  revalidatePath("/registros");
  revalidatePath("/dashboard");
  redirect("/registros");
}

export async function deleteWorkLog(workLogId: string) {
  const userId = await requireUserId();

  await prisma.workLog.deleteMany({ where: { id: workLogId, userId } });

  revalidatePath("/registros");
  revalidatePath("/dashboard");
}
