import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { addDays, startOfWeek } from "@/lib/dates/week";
import { todayForUser } from "@/lib/dates/server";
import { computeAverages } from "@/lib/metrics";
import { RouteSimulator } from "@/components/simulator/route-simulator";

export const metadata: Metadata = { title: "Simulador de ruta" };

// "¿Me conviene esta ruta?": compara una oferta hipotética contra el
// histórico real del usuario (12 semanas, sin filtro de empresa).
export default async function SimulatorPage() {
  const userId = await requireUserId();
  const today = await todayForUser();

  const { weekStartDay } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { weekStartDay: true },
  });
  const windowStart = addDays(startOfWeek(today, weekStartDay), -77);

  const logs = await prisma.workLog.findMany({
    where: { userId, date: { gte: windowStart } },
    select: {
      date: true,
      totalEarned: true,
      workedMinutes: true,
      entries: { select: { quantity: true } },
    },
  });

  const { perHourCents, perPackageCents } = computeAverages(
    logs.map((log) => ({
      date: log.date,
      totalEarnedCents: Math.round(Number(log.totalEarned) * 100),
      workedMinutes: log.workedMinutes,
      packages: log.entries.reduce((sum, entry) => sum + entry.quantity, 0),
      milesTenths: null,
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Simulador de ruta
        </h1>
        <p className="text-sm text-muted-foreground">
          ¿Te ofrecen otra ruta? Mete sus tarifas y volumen estimado y compárala
          con lo que ganas hoy.
        </p>
      </div>
      <RouteSimulator
        historicalPerHourCents={perHourCents}
        historicalPerPackageCents={perPackageCents}
      />
    </div>
  );
}
