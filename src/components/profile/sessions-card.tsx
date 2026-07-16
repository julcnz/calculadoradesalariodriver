"use client";

import { useTransition } from "react";
import { Monitor, Smartphone, LogOut } from "lucide-react";
import { closeOtherSessions, closeSession } from "@/server/actions/sessions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type SessionItem = {
  id: string;
  device: string; // descripción legible del user-agent
  isMobile: boolean;
  ip: string | null;
  createdAt: string; // ISO
  lastActiveAt: string; // ISO
  isCurrent: boolean;
};

// Se formatea en el cliente para usar la zona horaria del navegador.
function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function SessionRow({ session }: { session: SessionItem }) {
  const [isPending, startTransition] = useTransition();
  const Icon = session.isMobile ? Smartphone : Monitor;

  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="size-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{session.device}</p>
          {session.isCurrent && <Badge>Este dispositivo</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          Inició: {formatDateTime(session.createdAt)} · Última actividad:{" "}
          {formatDateTime(session.lastActiveAt)}
          {session.ip && session.ip !== "local" ? ` · IP ${session.ip}` : ""}
        </p>
      </div>
      {!session.isCurrent && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => closeSession(session.id))}
        >
          {isPending ? "…" : "Cerrar"}
        </Button>
      )}
    </div>
  );
}

export function SessionsCard({ sessions }: { sessions: SessionItem[] }) {
  const [isPending, startTransition] = useTransition();
  const hasOthers = sessions.some((s) => !s.isCurrent);

  return (
    <div className="space-y-3">
      <div className="divide-y">
        {sessions.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </div>
      {hasOthers && (
        <>
          <Separator />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => closeOtherSessions())}
          >
            <LogOut className="size-4" />
            {isPending ? "Cerrando…" : "Cerrar las demás sesiones"}
          </Button>
        </>
      )}
    </div>
  );
}
