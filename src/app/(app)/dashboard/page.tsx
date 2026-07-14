import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Aquí verás tus ganancias y métricas. (En construcción)
      </p>
    </div>
  );
}
