/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// --- Web Push: recordatorio diario ---
// Serwist no maneja push; estos listeners son manuales.
type ReminderPushData = { title?: string; body?: string; url?: string };

self.addEventListener("push", (event) => {
  let data: ReminderPushData = {};
  try {
    data = (event.data?.json() as ReminderPushData) ?? {};
  } catch {
    // payload no-JSON: se ignora y se usan los textos por defecto
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Driver Calculator", {
      body: data.body ?? "Registra tu día en un minuto.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url ?? "/registros/nuevo" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string })?.url ?? "/registros/nuevo";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const client = clients[0];
        if (client) {
          return client.focus().then((focused) => {
            // navigate puede no existir en algunos navegadores
            return focused.navigate?.(url) ?? undefined;
          });
        }
        return self.clients.openWindow(url);
      })
  );
});
