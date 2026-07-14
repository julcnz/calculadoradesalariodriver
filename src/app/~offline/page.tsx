import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sin conexión" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Sin conexión</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Parece que no tienes internet. Revisa tu conexión y vuelve a
        intentarlo: tus datos siguen guardados.
      </p>
    </main>
  );
}
