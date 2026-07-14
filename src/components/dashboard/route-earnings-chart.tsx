"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";

export type RouteEarningsDatum = {
  route: string;
  total: number;
  days: number;
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: RouteEarningsDatum }[];
}) {
  if (!active || !payload?.length) return null;
  const datum = payload[0].payload;
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{datum.route}</p>
      <p className="text-muted-foreground">
        {formatCurrency(datum.total)} · {datum.days}{" "}
        {datum.days === 1 ? "día trabajado" : "días trabajados"}
      </p>
    </div>
  );
}

export function RouteEarningsChart({ data }: { data: RouteEarningsDatum[] }) {
  // Altura proporcional a la cantidad de rutas (barras horizontales).
  const height = Math.max(140, data.length * 56 + 40);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 48, bottom: 4, left: 4 }}
      >
        <CartesianGrid
          horizontal={false}
          stroke="var(--color-border)"
          strokeDasharray="0"
        />
        <XAxis
          type="number"
          tickFormatter={(value: number) => formatCurrency(value)}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="route"
          width={110}
          tick={{ fill: "var(--color-foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
        />
        <Bar
          dataKey="total"
          fill="var(--color-chart-3)"
          radius={[0, 4, 4, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
