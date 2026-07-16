"use client";

import { useState, useTransition } from "react";
import { MailWarning } from "lucide-react";
import { resendVerificationEmail } from "@/server/actions/email-verification";

export function VerifyEmailBanner() {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="border-b bg-muted/60">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-xs text-muted-foreground">
        <MailWarning className="size-4 shrink-0" />
        {status === "sent" ? (
          <span>Correo enviado: revisa tu bandeja de entrada (y el spam).</span>
        ) : (
          <>
            <span>
              Verifica tu email para asegurar tu cuenta.
              {status === "error" && errorMsg ? ` ${errorMsg}` : ""}
            </span>
            <button
              type="button"
              disabled={isPending}
              className="font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50"
              onClick={() =>
                startTransition(async () => {
                  const result = await resendVerificationEmail();
                  if (result.error) {
                    setErrorMsg(result.error);
                    setStatus("error");
                  } else {
                    setStatus("sent");
                  }
                })
              }
            >
              {isPending ? "Enviando…" : "Reenviar correo"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
