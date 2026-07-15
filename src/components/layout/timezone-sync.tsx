"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Mantiene la cookie `tz` con la zona horaria IANA del navegador para que
// el servidor calcule "hoy" con la fecha local del usuario (no la de Vercel).
export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return;
    const current = document.cookie.match(/(?:^|; )tz=([^;]*)/)?.[1];
    if (current !== timeZone) {
      document.cookie = `tz=${timeZone}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    }
  }, [router]);

  return null;
}
