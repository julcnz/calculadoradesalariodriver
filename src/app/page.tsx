import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarRange,
  ClipboardList,
  CloudOff,
  Code2,
  Gauge,
  MonitorSmartphone,
  Receipt,
  Route,
  Wallet,
  Zap,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { DashboardPreview } from "@/components/landing/dashboard-preview";

const GITHUB_URL = "https://github.com/julcnz/calculadoradesalariodriver";

export const metadata: Metadata = {
  title: "Calculadora de Salario Driver — ¿Cuánto ganaste realmente?",
  description:
    "La app gratuita y open source para conductores de reparto independientes: registra tus entregas por tarifa, resta tus gastos y conoce tu ganancia neta real. Funciona sin conexión y se instala sin tiendas.",
  openGraph: {
    title: "¿Sabes cuánto ganaste realmente esta semana?",
    description:
      "Registra tus entregas, resta tus gastos y conoce tu ganancia neta real. Gratis, open source y sin tiendas de apps.",
    type: "website",
    locale: "es",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Calculadora de Salario Driver" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "¿Sabes cuánto ganaste realmente esta semana?",
    description:
      "La app open source que le dice a los conductores de reparto cuánto les quedó de verdad.",
    images: ["/og.png"],
  },
};

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Registra tu día en segundos",
    description:
      "Cantidad de paquetes por tarifa y listo: el total se calcula solo. Horas y millas opcionales, con odómetro si lo prefieres.",
  },
  {
    icon: Route,
    title: "Tus rutas, tus tarifas",
    description:
      "Cada ruta con sus propias tarifas ($1.45 completa, $0.50 doble o las que tú definas). Si cambian, tu historial queda intacto.",
  },
  {
    icon: Wallet,
    title: "Ganancia neta real",
    description:
      "Anota gasolina, mantenimiento y peajes por categoría. El dashboard te muestra lo que de verdad te quedó, no solo lo que facturaste.",
  },
  {
    icon: CalendarRange,
    title: "Tu semana de pago, no la del calendario",
    description:
      "¿Te pagan de martes a lunes? Configúralo una vez y todos los totales, metas y gráficos respetan tu semana real.",
  },
  {
    icon: Gauge,
    title: "$/hora y $/milla de verdad",
    description:
      "Promedios calculados solo con lo que registras, comparativa contra el período anterior y proyección de cómo cerrarás el mes.",
  },
  {
    icon: Receipt,
    title: "Listo para tus impuestos",
    description:
      "Deducción estimada por milla con tarifa configurable y exportación de todo a Excel o CSV con un clic.",
  },
] as const;

const STEPS = [
  {
    number: "01",
    title: "Crea tu ruta y sus tarifas",
    description:
      "Elige tu empresa, ponle nombre a tu ruta y define cuánto te pagan por cada tipo de entrega.",
  },
  {
    number: "02",
    title: "Anota tus entregas del día",
    description:
      "Al terminar tu jornada, registra cuántos paquetes entregaste por tarifa. Toma menos de un minuto, incluso sin señal.",
  },
  {
    number: "03",
    title: "Mira tus ganancias reales",
    description:
      "Ingresos, gastos, neto, promedios y metas: por día, tu semana de pago, mes, trimestre o año.",
  },
] as const;

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <p className="text-sm font-bold tracking-tight whitespace-nowrap">
            💵 Salario Driver
          </p>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/registro">Regístrate gratis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Para conductores de reparto independientes
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl leading-[1.05] font-extrabold tracking-tighter text-balance sm:text-6xl lg:text-7xl">
            ¿Sabes cuánto ganaste{" "}
            <span className="underline decoration-emerald-500 decoration-4 underline-offset-8 sm:decoration-8">
              realmente
            </span>{" "}
            esta semana?
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Registra tus entregas por tarifa, resta tus gastos y conoce tu
            ganancia neta real — por día, por tu semana de pago o por año.
            Sin hojas de cálculo, sin cuentas mentales.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href="/registro">Regístrate gratis</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Gratis · Open source · Sin tiendas de apps · Funciona sin conexión
          </p>
        </section>

        {/* El problema */}
        <section className="border-y bg-muted/40">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              La app de tu empresa te dice cuántos paquetes entregaste.
              <span className="text-muted-foreground">
                {" "}
                No te dice cuánto te quedó.
              </span>
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Entre la gasolina, el mantenimiento, los peajes y las millas
                que le metes al carro, el número que ves en la app de entregas
                no es lo que llega a tu bolsillo.
              </p>
              <p>
                Y cuando tu semana de pago no coincide con la del calendario,
                ni siquiera los totales semanales te cuadran.
              </p>
              <p className="font-medium text-foreground">
                Esta app existe para responder una sola pregunta: ¿cuánto
                ganaste de verdad?
              </p>
            </div>
          </div>
        </section>

        {/* Funcionalidades */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Todo lo que necesitas para llevar tus cuentas
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl border bg-card p-6">
                <Icon className="size-6" aria-hidden />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Vista del producto */}
        <section className="border-y bg-muted/40">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Tu dinero, claro de un vistazo
              </h2>
              <p className="mt-4 text-muted-foreground">
                Ingresos, gastos, ganancia neta, promedios por hora y por
                milla, tu meta de la semana, tu racha de días y hasta la
                deducción estimada para impuestos. Filtrado por el período que
                quieras y por empresa.
              </p>
              <p className="sr-only">
                Vista de ejemplo del dashboard con datos ficticios: ingresos de
                la semana, gastos por categoría, ganancia neta, promedios por
                hora y milla, calendario de constancia y ganancias por ruta.
              </p>
            </div>
            <DashboardPreview />
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Cómo funciona
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number}>
                <p className="text-5xl font-extrabold tracking-tighter text-muted-foreground/30 tabular-nums sm:text-6xl">
                  {step.number}
                </p>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* PWA + offline */}
        <section className="border-y bg-muted/40">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 sm:py-20">
            <div className="rounded-xl border bg-card p-6 sm:p-8">
              <MonitorSmartphone className="size-6" aria-hidden />
              <h2 className="mt-4 text-xl font-bold tracking-tight">
                Instálala como app, sin tiendas
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Desde el navegador de tu teléfono: &ldquo;Agregar a pantalla de
                inicio&rdquo; y listo. Con atajos directos para registrar tu
                día o un gasto, y modo claro y oscuro.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 sm:p-8">
              <CloudOff className="size-6" aria-hidden />
              <h2 className="mt-4 text-xl font-bold tracking-tight">
                Funciona donde no hay señal
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                ¿Terminaste la ruta en una zona muerta? Registra tu día igual:
                queda guardado en tu teléfono y se sincroniza solo cuando
                vuelve el internet.
              </p>
            </div>
          </div>
        </section>

        {/* Open source */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                <Code2 className="size-4" aria-hidden />
                Open source · AGPL-3.0
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Tu dinero es tuyo. El código también.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Todo el código es abierto: revísalo, propón mejoras o monta tu
                propia copia. Además, tus datos se exportan a Excel o CSV
                cuando quieras — nada de quedarte atrapado.
              </p>
            </div>
            <Button asChild variant="outline" size="lg">
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <Code2 className="size-4" aria-hidden />
                Ver el código en GitHub
              </a>
            </Button>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-20 text-center sm:py-28">
            <Zap className="size-8" aria-hidden />
            <h2 className="mt-6 max-w-3xl text-3xl leading-tight font-extrabold tracking-tighter text-balance sm:text-5xl">
              Empieza hoy y sabrás cuánto ganaste esta misma semana.
            </h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Crear tu cuenta toma un minuto. Configurar tu ruta, otro más.
            </p>
            <Button asChild size="lg" className="mt-8 h-12 px-8 text-base">
              <Link href="/registro">Regístrate gratis</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>💵 Calculadora de Salario Driver</p>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/login" className="hover:text-foreground">
              Iniciar sesión
            </Link>
            <Link href="/registro" className="hover:text-foreground">
              Crear cuenta
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </a>
          </nav>
          <p>Open source · AGPL-3.0</p>
        </div>
      </footer>
    </div>
  );
}
