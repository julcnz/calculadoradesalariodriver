"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { TIME_REGEX } from "@/lib/dates/time";

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export type ReminderActionState = { error?: string; success?: boolean } | null;

// Activa el recordatorio: guarda la suscripción push del navegador actual
// (upsert por endpoint: un mismo navegador puede re-suscribirse) y la
// configuración de hora/zona del usuario.
export async function enableReminder(input: {
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  reminderTime: string;
  timeZone: string;
}): Promise<ReminderActionState> {
  const userId = await requireUserId();

  const { subscription, reminderTime, timeZone } = input;
  if (!TIME_REGEX.test(reminderTime)) {
    return { error: "Elige una hora válida para el recordatorio" };
  }
  if (!isValidTimeZone(timeZone)) {
    return { error: "No pudimos detectar tu zona horaria" };
  }
  if (
    !subscription?.endpoint ||
    !subscription.keys?.p256dh ||
    !subscription.keys?.auth
  ) {
    return { error: "La suscripción del navegador llegó incompleta" };
  }

  await prisma.$transaction([
    prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { reminderEnabled: true, reminderTime, timeZone },
    }),
  ]);

  revalidatePath("/configuracion");
  return { success: true };
}

export async function updateReminderTime(
  reminderTime: string
): Promise<ReminderActionState> {
  const userId = await requireUserId();
  if (!TIME_REGEX.test(reminderTime)) {
    return { error: "Elige una hora válida" };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { reminderTime },
  });
  revalidatePath("/configuracion");
  return { success: true };
}

// Desactiva el recordatorio; si llega el endpoint del navegador actual,
// borra también esa suscripción.
export async function disableReminder(
  endpoint?: string
): Promise<ReminderActionState> {
  const userId = await requireUserId();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { reminderEnabled: false },
    }),
    ...(endpoint
      ? [prisma.pushSubscription.deleteMany({ where: { userId, endpoint } })]
      : []),
  ]);
  revalidatePath("/configuracion");
  return { success: true };
}

// Mantiene User.timeZone alineada con la cookie tz (la usa el cron de
// recordatorios, que no tiene acceso a cookies).
export async function syncTimeZone(timeZone: string): Promise<void> {
  const userId = await requireUserId();
  if (!isValidTimeZone(timeZone)) return;
  await prisma.user.update({
    where: { id: userId },
    data: { timeZone },
  });
}
