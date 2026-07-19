"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import {
  createRouteSchema,
  rateTypeSchema,
  updateRouteSchema,
} from "@/lib/validations/route";

export type RouteFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | null;

function parseRatesFromForm(formData: FormData) {
  const names = formData.getAll("rateName");
  const amounts = formData.getAll("rateAmount");
  return names.map((name, i) => ({
    name: String(name),
    amount: String(amounts[i] ?? ""),
  }));
}

// Núcleo compartido por el formulario de /rutas/nueva y el alta rápida de
// Ajustes. Devuelve null si la ruta se creó bien.
async function persistRoute(
  userId: string,
  formData: FormData
): Promise<RouteFormState> {
  const parsed = createRouteSchema.safeParse({
    companyId: formData.get("companyId"),
    name: formData.get("name"),
    rates: parseRatesFromForm(formData),
  });
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    const rateErrors = Object.keys(flat.fieldErrors).some((k) =>
      k.startsWith("rates")
    )
      ? ["Revisa las tarifas: cada una necesita nombre y un valor válido (ej. 1.45)"]
      : undefined;
    return {
      errors: {
        ...flat.fieldErrors,
        ...(rateErrors ? { rates: rateErrors } : {}),
      },
    };
  }

  const company = await prisma.company.findFirst({
    where: { id: parsed.data.companyId, userId },
  });
  if (!company) {
    return { message: "La empresa seleccionada no existe" };
  }

  await prisma.route.create({
    data: {
      companyId: company.id,
      name: parsed.data.name,
      rateTypes: {
        create: parsed.data.rates.map((rate, index) => ({
          name: rate.name,
          amount: rate.amount,
          sortOrder: index,
        })),
      },
    },
  });

  return null;
}

export async function createRoute(
  _prevState: RouteFormState,
  formData: FormData
): Promise<RouteFormState> {
  const userId = await requireUserId();
  const state = await persistRoute(userId, formData);
  if (state) return state;

  revalidatePath("/rutas");
  redirect("/rutas");
}

// Alta rápida desde Ajustes: sin redirect, la tarjeta se refresca en sitio.
export async function createRouteFromSettings(
  _prevState: RouteFormState,
  formData: FormData
): Promise<RouteFormState> {
  const userId = await requireUserId();
  const state = await persistRoute(userId, formData);
  if (state) return state;

  revalidatePath("/rutas");
  revalidatePath("/configuracion");
  return { success: true };
}

export async function updateRouteName(
  _prevState: RouteFormState,
  formData: FormData
): Promise<RouteFormState> {
  const userId = await requireUserId();

  const parsed = updateRouteSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  await prisma.route.updateMany({
    where: { id: parsed.data.id, company: { userId } },
    data: { name: parsed.data.name },
  });

  revalidatePath("/rutas");
  return null;
}

export async function addRateType(
  _prevState: RouteFormState,
  formData: FormData
): Promise<RouteFormState> {
  const userId = await requireUserId();
  const routeId = String(formData.get("routeId") ?? "");

  const parsed = rateTypeSchema.safeParse({
    name: formData.get("rateName"),
    amount: formData.get("rateAmount"),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const route = await prisma.route.findFirst({
    where: { id: routeId, company: { userId } },
    include: { _count: { select: { rateTypes: true } } },
  });
  if (!route) return { message: "La ruta no existe" };

  await prisma.rateType.create({
    data: {
      routeId: route.id,
      name: parsed.data.name,
      amount: parsed.data.amount,
      sortOrder: route._count.rateTypes,
    },
  });

  revalidatePath("/rutas");
  return null;
}

// Regla 1: cambiar nombre o valor de una tarifa solo afecta registros FUTUROS;
// los pasados conservan su snapshot.
export async function updateRateType(
  _prevState: RouteFormState,
  formData: FormData
): Promise<RouteFormState> {
  const userId = await requireUserId();
  const rateTypeId = String(formData.get("rateTypeId") ?? "");

  const parsed = rateTypeSchema.safeParse({
    name: formData.get("rateName"),
    amount: formData.get("rateAmount"),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  await prisma.rateType.updateMany({
    where: { id: rateTypeId, route: { company: { userId } } },
    data: { name: parsed.data.name, amount: parsed.data.amount },
  });

  revalidatePath("/rutas");
  return null;
}

export async function toggleRateTypeActive(rateTypeId: string) {
  const userId = await requireUserId();

  const rateType = await prisma.rateType.findFirst({
    where: { id: rateTypeId, route: { company: { userId } } },
  });
  if (!rateType) return;

  await prisma.rateType.update({
    where: { id: rateType.id },
    data: { isActive: !rateType.isActive },
  });

  revalidatePath("/rutas");
}

export async function deleteRoute(routeId: string): Promise<{ error?: string }> {
  const userId = await requireUserId();

  const workLogCount = await prisma.workLog.count({ where: { routeId } });
  if (workLogCount > 0) {
    return {
      error:
        "No se puede eliminar: tiene registros de trabajo asociados. Puedes desactivar sus tarifas o dejar de usarla.",
    };
  }

  await prisma.route.deleteMany({
    where: { id: routeId, company: { userId } },
  });
  revalidatePath("/rutas");
  return {};
}
