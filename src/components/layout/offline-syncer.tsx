"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, X } from "lucide-react";
import { syncOfflineWorkLog } from "@/server/actions/worklogs";
import {
  readOfflineQueue,
  removeFromOfflineQueue,
  requeueWorkLog,
} from "@/lib/offline-queue";

// Candado a nivel de módulo: evita envíos duplicados aunque haya varias
// instancias o invocaciones concurrentes (p. ej. StrictMode en desarrollo).
let syncInFlight = false;

// El aviso debe sobrevivir al router.refresh() que remonta el componente.
const NOTICE_KEY = "salario-driver-aviso-sync";

// Envía los registros guardados sin conexión cuando vuelve el internet.
export function OfflineSyncer() {
  const router = useRouter();
  const [syncedCount, setSyncedCount] = useState(0);

  const flush = useCallback(async () => {
    if (syncInFlight || !navigator.onLine) return;
    if (readOfflineQueue().length === 0) return;

    syncInFlight = true;
    let sent = 0;
    try {
      let item = readOfflineQueue()[0];
      while (item) {
        // Se retira ANTES de enviar: si algo vuelve a disparar el flush,
        // nadie más puede tomar este mismo registro.
        removeFromOfflineQueue(item.id);
        try {
          const result = await syncOfflineWorkLog(item.pairs);
          if (result.ok) sent += 1;
          // discard: datos inválidos, se descarta sin reintentar.
        } catch {
          // Falló la red: lo devolvemos a la cola y paramos.
          requeueWorkLog(item);
          break;
        }
        item = readOfflineQueue()[0];
      }
    } finally {
      syncInFlight = false;
    }

    if (sent > 0) {
      sessionStorage.setItem(NOTICE_KEY, String(sent));
      setSyncedCount(sent);
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    const initialFlush = setTimeout(() => {
      const pendingNotice = sessionStorage.getItem(NOTICE_KEY);
      if (pendingNotice) {
        setSyncedCount(Number(pendingNotice));
      }
      flush();
    }, 0);
    window.addEventListener("online", flush);
    return () => {
      clearTimeout(initialFlush);
      window.removeEventListener("online", flush);
    };
  }, [flush]);

  if (syncedCount === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-6">
      <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm shadow-lg">
        <CloudUpload className="size-4 text-muted-foreground" />
        <span>
          {syncedCount === 1
            ? "1 registro offline sincronizado"
            : `${syncedCount} registros offline sincronizados`}
        </span>
        <button
          type="button"
          aria-label="Cerrar aviso"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            sessionStorage.removeItem(NOTICE_KEY);
            setSyncedCount(0);
          }}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
