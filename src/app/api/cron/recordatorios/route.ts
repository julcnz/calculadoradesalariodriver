import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayInTimeZone } from "@/lib/dates/week";
import { toDateParam } from "@/lib/dates/week";
import { sendPushNotification } from "@/lib/push";

// Recordatorio diario push. Lo invoca un workflow de GitHub Actions cada hora
// (Vercel Hobby solo permite crons diarios) con Authorization: Bearer
// CRON_SECRET. Por cada usuario con recordatorio activo:
//   1. calcula su hora local (User.timeZone) y compara con reminderTime;
//      ventana [target, target+75min) — absorbe los retrasos típicos de
//      GitHub Actions. Sin cruce de medianoche: un recordatorio a las 23:30
//      puede perderse si el runner llega pasadas las 00:00 (caso raro:
//      los recordatorios reales son diurnos/vespertinos).
//   2. no notifica si ya registró trabajo en SU "hoy" local, ni dos veces
//      el mismo día (reminderLastSentOn).
//   3. borra suscripciones muertas (404/410).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new NextResponse(null, { status: 401 });
  }

  const WINDOW_MINUTES = 75;
  const now = new Date();

  const users = await prisma.user.findMany({
    where: {
      reminderEnabled: true,
      reminderTime: { not: null },
      pushSubscriptions: { some: {} },
    },
    select: {
      id: true,
      reminderTime: true,
      timeZone: true,
      reminderLastSentOn: true,
      pushSubscriptions: {
        select: { id: true, endpoint: true, p256dh: true, auth: true },
      },
    },
  });

  let notified = 0;
  let deadSubscriptions = 0;

  for (const user of users) {
    const timeZone = user.timeZone ?? "UTC";

    // Minutos locales actuales del usuario (respeta tz con medias horas).
    let nowMinutes: number;
    try {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      }).formatToParts(now);
      const hour = Number(parts.find((p) => p.type === "hour")?.value);
      const minute = Number(parts.find((p) => p.type === "minute")?.value);
      nowMinutes = (hour % 24) * 60 + minute;
    } catch {
      continue; // tz corrupta: no arriesgar una notificación a deshora
    }

    const [targetHour, targetMinute] = (user.reminderTime as string)
      .split(":")
      .map(Number);
    const targetMinutes = targetHour * 60 + targetMinute;
    if (nowMinutes < targetMinutes || nowMinutes >= targetMinutes + WINDOW_MINUTES) {
      continue;
    }

    const localToday = todayInTimeZone(timeZone);

    // Dedupe: ya se le notificó hoy (en su día local).
    if (
      user.reminderLastSentOn &&
      toDateParam(user.reminderLastSentOn) === toDateParam(localToday)
    ) {
      continue;
    }

    // Si ya registró su día, no hay nada que recordar.
    const workedToday = await prisma.workLog.findFirst({
      where: { userId: user.id, date: localToday },
      select: { id: true },
    });
    if (workedToday) continue;

    let delivered = false;
    for (const subscription of user.pushSubscriptions) {
      const result = await sendPushNotification(subscription, {
        title: "¿Trabajaste hoy? 🚚",
        body: "Registra tu día en un minuto y mantén tu racha 🔥",
        url: "/registros/nuevo",
      });
      if (result.ok) delivered = true;
      if (result.gone) {
        await prisma.pushSubscription.delete({
          where: { id: subscription.id },
        });
        deadSubscriptions += 1;
      }
    }

    if (delivered) {
      notified += 1;
      await prisma.user.update({
        where: { id: user.id },
        data: { reminderLastSentOn: localToday },
      });
    }
  }

  return NextResponse.json({
    usuariosNotificados: notified,
    suscripcionesEliminadas: deadSubscriptions,
  });
}
