import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Guía de inicio" };

export default async function GuidePage() {
  const userId = await requireUserId();

  const [companies, routes, workLogs, expenses, goals] = await Promise.all([
    prisma.company.count({ where: { userId } }),
    prisma.route.count({ where: { company: { userId } } }),
    prisma.workLog.count({ where: { userId } }),
    prisma.expense.count({ where: { userId } }),
    prisma.goal.count({ where: { userId } }),
  ]);

  const steps = [
    {
      title: "Agrega tu empresa",
      description:
        "La empresa para la que repartes. Puedes elegirla del listado o escribir la tuya.",
      href: "/empresas",
      cta: "Ir a Empresas",
      done: companies > 0,
    },
    {
      title: "Crea tu ruta con sus tarifas",
      description:
        "Cada ruta tiene sus tarifas por paquete (ej. Tarifa completa $1.45). Todo es editable.",
      href: "/rutas/nueva",
      cta: "Crear ruta",
      done: routes > 0,
    },
    {
      title: "Registra tu primer día de trabajo",
      description:
        "Paquetes entregados por tarifa, y si quieres, millas y horas. El total se calcula solo.",
      href: "/registros/nuevo",
      cta: "Registrar mi día",
      done: workLogs > 0,
    },
    {
      title: "Configura tu semana de pago y tus metas",
      description:
        "Elige el día en que comienza tu semana y define cuánto quieres ganar por período.",
      href: "/configuracion",
      cta: "Ir a Configuración",
      done: goals > 0,
    },
    {
      title: "Anota tus gastos",
      description:
        "Gasolina, mantenimiento… así el dashboard te muestra tu ganancia neta real.",
      href: "/gastos/nuevo",
      cta: "Registrar un gasto",
      done: expenses > 0,
    },
  ];

  const completed = steps.filter((step) => step.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Guía de inicio</h1>
        <p className="text-sm text-muted-foreground">
          Sigue estos pasos para dejar la app lista. Puedes volver aquí cuando
          quieras desde Ajustes.
        </p>
      </div>

      <div className="space-y-2">
        <Progress value={pct} aria-label="Progreso de la guía" />
        <p className="text-xs text-muted-foreground">
          {completed} de {steps.length} pasos completados
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <Card
            key={step.title}
            className={cn(step.done && "border-primary/30 bg-muted/30")}
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                ) : (
                  <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <CardTitle className="text-base">
                    {index + 1}. {step.title}
                  </CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            {!step.done && (
              <CardContent className="pl-12">
                <Button asChild size="sm">
                  <Link href={step.href}>
                    {step.cta}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {completed === steps.length && (
        <Card>
          <CardHeader>
            <CardTitle>🎉 ¡Todo listo!</CardTitle>
            <CardDescription>
              Ya tienes la app configurada. Tu rutina diaria: registrar el día
              en un minuto y ver tus ganancias en el dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">Ir al dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
