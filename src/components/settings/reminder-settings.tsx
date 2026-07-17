"use client";

import { useState, useTransition } from "react";
import {
  disableReminder,
  enableReminder,
  updateReminderTime,
} from "@/server/actions/reminders";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Convierte la clave VAPID pública (base64url) al Uint8Array que pide
// pushManager.subscribe.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function ReminderSettings({
  enabled,
  time,
}: {
  enabled: boolean;
  time: string;
}) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [reminderTime, setReminderTime] = useState(time || "19:00");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const activate = async () => {
    setError(null);
    setNotice(null);

    if (!pushSupported()) {
      setError(
        "Tu navegador no soporta notificaciones aquí. En iPhone: instala la app en tu pantalla de inicio (Compartir → Agregar a pantalla de inicio) y actívalas desde ahí."
      );
      return;
    }
    if (!vapidPublicKey) {
      setError(
        "Falta configurar las claves de notificaciones en el servidor (VAPID)."
      );
      return;
    }

    // El permiso DEBE pedirse dentro del gesto del usuario (iOS lo exige).
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setError(
        "Sin permiso de notificaciones no hay recordatorio. Puedes habilitarlo en los ajustes de tu navegador y volver a intentar."
      );
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setError("El navegador devolvió una suscripción incompleta.");
        return;
      }
      startTransition(async () => {
        const result = await enableReminder({
          subscription: {
            endpoint: json.endpoint as string,
            keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
          },
          reminderTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        if (result?.error) {
          setError(result.error);
        } else {
          setIsEnabled(true);
          setNotice("Recordatorio activado ✓");
        }
      });
    } catch {
      setError("No se pudo crear la suscripción de notificaciones.");
    }
  };

  const deactivate = async () => {
    setError(null);
    setNotice(null);
    let endpoint: string | undefined;
    try {
      if (pushSupported()) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        endpoint = subscription?.endpoint;
        await subscription?.unsubscribe();
      }
    } catch {
      // si falla el unsubscribe local, igual se desactiva en el servidor
    }
    startTransition(async () => {
      await disableReminder(endpoint);
      setIsEnabled(false);
      setNotice("Recordatorio desactivado");
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="reminder-switch" className="font-normal">
          Recordarme registrar mi día
        </Label>
        <Switch
          id="reminder-switch"
          checked={isEnabled}
          disabled={isPending}
          onCheckedChange={(checked) => {
            if (checked) void activate();
            else void deactivate();
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <Label htmlFor="reminder-time" className="text-sm text-muted-foreground">
          A las
        </Label>
        <Input
          id="reminder-time"
          type="time"
          value={reminderTime}
          className="w-32"
          onChange={(e) => {
            const value = e.target.value;
            setReminderTime(value);
            if (isEnabled && value) {
              startTransition(async () => {
                const result = await updateReminderTime(value);
                if (result?.error) setError(result.error);
              });
            }
          }}
        />
      </div>

      {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Te avisamos a esa hora solo si aún no registraste tu día — para no
        romper tu racha 🔥. El aviso puede llegar con algunos minutos de
        diferencia.
      </p>
    </div>
  );
}
