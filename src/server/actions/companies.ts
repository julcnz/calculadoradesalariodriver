"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { createCompanySchema } from "@/lib/validations/company";

export type CompanyFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | null;

export async function createCompany(
  _prevState: CompanyFormState,
  formData: FormData
): Promise<CompanyFormState> {
  const userId = await requireUserId();

  // Regla 6: conservamos el texto original SIN normalizar para CompanySuggestion.
  const rawName = String(formData.get("name") ?? "");

  const parsed = createCompanySchema.safeParse({
    name: rawName,
    isCustom: formData.get("isCustom") === "true",
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { name, isCustom } = parsed.data;

  await prisma.$transaction(async (tx) => {
    // La nueva empresa pasa a ser la activa.
    await tx.company.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
    await tx.company.create({
      data: {
        userId,
        name,
        isCustom,
        isActive: true,
        startedAt: new Date(),
      },
    });
    if (isCustom) {
      // Regla 6: se guarda el texto tal cual, sin normalizar.
      await tx.companySuggestion.create({
        data: { userId, rawText: rawName },
      });
    }
  });

  revalidatePath("/empresas");
  revalidatePath("/configuracion"); // la tarjeta de Ajustes muestra la lista
  return { success: true };
}

export async function setActiveCompany(companyId: string) {
  const userId = await requireUserId();

  await prisma.$transaction(async (tx) => {
    const company = await tx.company.findFirst({
      where: { id: companyId, userId },
    });
    if (!company) return;

    await tx.company.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
    await tx.company.update({
      where: { id: companyId },
      data: { isActive: true, endedAt: null },
    });
  });

  revalidatePath("/empresas");
}

export async function finishCompany(companyId: string) {
  const userId = await requireUserId();

  await prisma.company.updateMany({
    where: { id: companyId, userId },
    data: { isActive: false, endedAt: new Date() },
  });

  revalidatePath("/empresas");
}

export async function deleteCompany(
  companyId: string
): Promise<{ error?: string }> {
  const userId = await requireUserId();

  const workLogCount = await prisma.workLog.count({
    where: { route: { companyId, company: { userId } } },
  });
  if (workLogCount > 0) {
    return {
      error:
        "No se puede eliminar: tiene registros de trabajo asociados. Puedes finalizarla para conservar el historial.",
    };
  }

  await prisma.company.deleteMany({ where: { id: companyId, userId } });
  revalidatePath("/empresas");
  revalidatePath("/rutas");
  return {};
}
