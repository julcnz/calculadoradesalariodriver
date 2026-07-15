"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, UserRound } from "lucide-react";
import { removeAvatar, uploadAvatar } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";

const AVATAR_SIZE = 256;

// Recorta al centro en cuadrado y reescala a 256px para guardar poco peso.
async function fileToAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function AvatarUploader({ avatarUrl }: { avatarUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Elige un archivo de imagen");
      return;
    }
    startTransition(async () => {
      try {
        const dataUrl = await fileToAvatarDataUrl(file);
        const result = await uploadAvatar(dataUrl);
        setError(result.error ?? null);
        if (!result.error) router.refresh();
      } catch {
        setError("No se pudo procesar la imagen");
      }
    });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar servido por nuestra propia API, sin optimizador
          <img
            src={avatarUrl}
            alt="Foto de perfil"
            className="size-full object-cover"
          />
        ) : (
          <UserRound className="size-8 text-muted-foreground" />
        )}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="size-4" />
            {isPending
              ? "Subiendo…"
              : avatarUrl
                ? "Cambiar foto"
                : "Subir foto"}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await removeAvatar();
                  setError(null);
                  router.refresh();
                })
              }
            >
              <Trash2 className="size-4" />
              Quitar
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG o WebP. Se recorta al centro y se guarda en 256×256.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
