"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncTimeZone } from "@/server/actions/reminders";

// Mantiene la cookie `tz` con la zona horaria IANA del navegador para que
// el servidor calcule "hoy" con la fecha local del usuario (no la de Vercel).
// También la persiste en BD (User.timeZone) para el cron de recordatorios.
export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return;
    const current = document.cookie.match(/(?:^|; )tz=([^;]*)/)?.[1];
    if (current !== timeZone) {
      document.cookie = `tz=${timeZone}; path=/; max-age=31536000; samesite=lax`;
      void syncTimeZone(timeZone).catch(() => {
        // sin red no pasa nada: se reintenta en la próxima visita
      });
      router.refresh();
    }
  }, [router]);

  return null;
}
