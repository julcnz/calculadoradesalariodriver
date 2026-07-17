import webpush from "web-push";

// Envío de notificaciones Web Push (VAPID). Igual que el correo: sin claves
// configuradas, se simula en la consola del servidor (suficiente en local).
// Generar claves UNA vez con `npx web-push generate-vapid-keys`; regenerarlas
// invalida TODAS las suscripciones existentes.

export type PushPayload = {
  title: string;
  body: string;
  url: string;
};

export type PushSubscriptionKeys = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

let vapidConfigured = false;

function ensureVapid(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  if (!vapidConfigured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:no-reply@salariodriver.app",
      publicKey,
      privateKey
    );
    vapidConfigured = true;
  }
  return true;
}

// `gone: true` significa que la suscripción murió (404/410) y hay que
// borrarla de la base de datos.
export async function sendPushNotification(
  subscription: PushSubscriptionKeys,
  payload: PushPayload
): Promise<{ ok: boolean; gone?: boolean }> {
  if (!ensureVapid()) {
    console.log("🔔 PUSH SIMULADO (configura VAPID_* para envíos reales)");
    console.log(`   → ${subscription.endpoint.slice(0, 60)}…`);
    console.log(`   ${payload.title} — ${payload.body} (${payload.url})`);
    return { ok: true };
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, gone: true };
    }
    console.error("No se pudo enviar la notificación push:", error);
    return { ok: false };
  }
}
