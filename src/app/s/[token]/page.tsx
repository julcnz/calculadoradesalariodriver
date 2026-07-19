import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLogo, BrandMark } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { loadSharedWeekSummary } from "@/lib/shared-week";

// Página PÚBLICA (sin sesión): resumen de una semana compartida por su
// dueño. Muestra ingresos, paquetes, días, $/h y racha — sin gastos ni
// neto (decisión de privacidad). El proxy la deja pasar (/s como
// /verificar) y los buscadores no la indexan.

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const summary = await loadSharedWeekSummary(token);
  if (!summary) {
    return { title: "Resumen no disponible", robots: { index: false } };
  }
  const title = `Semana del ${formatDate(summary.weekStart)} · Driver Calculator`;
  const description = `${formatCurrency(summary.incomeCents / 100)} en ${summary.packages} paquetes. Calculado con Driver Calculator, la app gratuita para conductores de reparto.`;
  return {
    title,
    description,
    robots: { index: false },
    openGraph: { title, description, type: "website", locale: "es" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharedWeekPage({ params }: Props) {
  const { token } = await params;
  const summary = await loadSharedWeekSummary(token);
  if (!summary) notFound();

  const stats = [
    {
      label: "Paquetes entregados",
      value: String(summary.packages),
    },
    {
      label: "Días trabajados",
      value: String(summary.daysWorked),
    },
    {
      label: "Promedio por hora",
      value:
        summary.perHourCents !== null
          ? `${formatCurrency(summary.perHourCents / 100)}/h`
          : "—",
    },
    {
      label: "Racha de días",
      value: summary.streak > 0 ? `${summary.streak} 🔥` : "—",
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-12">
        <BrandLogo />

        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {summary.ownerName
              ? `La semana de ${summary.ownerName}`
              : "Resumen semanal"}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            Del {formatDate(summary.weekStart)} al {formatDate(summary.weekEnd)}
          </h1>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Ingresos de la semana</p>
          <p className="mt-1 text-5xl font-extrabold tracking-tighter text-emerald-600 sm:text-6xl dark:text-emerald-500">
            {formatCurrency(summary.incomeCents / 100)}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border bg-card p-4">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="rounded-xl border bg-muted/40 p-5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <BrandMark className="size-5" />
            Calculado con Driver Calculator
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            La app gratuita y open source con la que los conductores de
            reparto saben cuánto ganan de verdad.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/">Calcula tu salario real</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
