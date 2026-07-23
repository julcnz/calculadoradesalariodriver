"use client";

import { useState, useTransition } from "react";
import { Check, Share2 } from "lucide-react";
import { createSharedWeekLink } from "@/server/actions/shared-weeks";
import type { PeriodType } from "@/lib/dates/week";
import { Button } from "@/components/ui/button";

// Comparte el período visible (día/semana/mes/trimestre/año): crea el enlace
// público y abre el share sheet del sistema (móvil) o lo copia al portapapeles.
export function ShareButton({
  periodo,
  fecha,
}: {
  periodo: PeriodType;
  fecha: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const share = () => {
    setError(null);
    startTransition(async () => {
      const result = await createSharedWeekLink(periodo, fecha);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      try {
        if (navigator.share) {
          await navigator.share({ url: result.url });
          return;
        }
      } catch {
        // usuario canceló el share sheet: caer al portapapeles
      }
      try {
        await navigator.clipboard.writeText(result.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        setError("No se pudo copiar el enlace");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={share}
        disabled={isPending}
      >
        {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
        {copied ? "Enlace copiado" : isPending ? "Creando…" : "Compartir"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
