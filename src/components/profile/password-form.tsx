"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/field-error";

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Contraseña actual</Label>
        <Input
          id="current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldError errors={state?.errors?.currentPassword} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">Nueva contraseña</Label>
        <Input
          id="new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-muted-foreground">
          Mínimo 8 caracteres, una mayúscula y un número.
        </p>
        <FieldError errors={state?.errors?.newPassword} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-new-password">Confirmar nueva contraseña</Label>
        <Input
          id="confirm-new-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        <FieldError errors={state?.errors?.confirmPassword} />
      </div>
      {state?.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Actualizando…" : "Actualizar contraseña"}
        </Button>
        {state?.success && (
          <p className="text-sm text-muted-foreground">
            Contraseña actualizada ✓
          </p>
        )}
      </div>
    </form>
  );
}
