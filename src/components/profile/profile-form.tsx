"use client";

import { useActionState } from "react";
import { updateProfile } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/field-error";

export function ProfileForm({
  name,
  email,
}: {
  name: string | null;
  email: string;
}) {
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="profile-name">Nombre</Label>
        <Input
          id="profile-name"
          name="name"
          defaultValue={name ?? ""}
          placeholder="Tu nombre"
          autoComplete="name"
        />
        <FieldError errors={state?.errors?.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-email">Email</Label>
        <Input
          id="profile-email"
          name="email"
          type="email"
          defaultValue={email}
          autoComplete="email"
          required
        />
        <p className="text-xs text-muted-foreground">
          Es el email con el que inicias sesión.
        </p>
        <FieldError errors={state?.errors?.email} />
      </div>
      {state?.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
        {state?.success && (
          <p className="text-sm text-muted-foreground">Cambios guardados ✓</p>
        )}
      </div>
    </form>
  );
}
