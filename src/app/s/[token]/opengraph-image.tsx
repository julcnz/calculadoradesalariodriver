import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { formatCurrency, formatDate } from "@/lib/format";
import { loadSharedWeekSummary } from "@/lib/shared-week";

// OG image dinámica del resumen compartido (preview rica en WhatsApp).
// Satori: solo flexbox y colores fijos (nada de CSS vars ni grid).
// Fuentes TTF commiteadas en src/assets/fonts (satori no lee woff2).

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Resumen semanal · SalarioDriver";

const BRAND_GREEN = "#4ade80";
const BRAND_BLACK = "#0a0a0a";

function loadFont(file: string) {
  return readFile(join(process.cwd(), "src/assets/fonts", file));
}

// BrandMark (mismos paths que src/components/brand/brand-logo.tsx).
function Mark({ size: markSize }: { size: number }) {
  return (
    <svg viewBox="0 0 56 56" width={markSize} height={markSize}>
      <path
        d="M28 4 C15.85 4 6 13.85 6 26 C6 38 20 48 28 53 C36 48 50 38 50 26 C50 13.85 40.15 4 28 4 Z"
        fill={BRAND_GREEN}
      />
      <circle cx="28" cy="25" r="14" fill={BRAND_BLACK} />
      <path
        d="M27 14.5 h2.4 v2.6 c2.9.4 4.9 2.2 5.1 4.9 h-3.3 c-.2-1.3-1.3-2.1-3-2.1-1.7 0-2.7.8-2.7 1.9 0 1.1.8 1.6 2.8 2.1l1.9.45c3.2.75 4.8 2.1 4.8 4.6 0 2.7-2 4.5-5 4.9 v2.65 h-2.4 v-2.6 c-3.1-.4-5.2-2.3-5.35-5.1 h3.3 c.2 1.5 1.5 2.4 3.5 2.4 1.9 0 3.1-.85 3.1-2.05 0-1.1-.8-1.75-2.9-2.25l-1.9-.45c-3-.7-4.6-2-4.6-4.4 0-2.6 2-4.3 4.85-4.75 v-2.65 z"
        fill={BRAND_GREEN}
      />
    </svg>
  );
}

function Wordmark({ fontSize }: { fontSize: number }) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: "Archivo",
        fontWeight: 800,
        fontSize,
        letterSpacing: "-0.02em",
      }}
    >
      <span style={{ color: "#fafafa" }}>Salario</span>
      <span style={{ color: BRAND_GREEN }}>Driver</span>
    </div>
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [summary, archivo800, inter800, inter400] = await Promise.all([
    loadSharedWeekSummary(token),
    loadFont("Archivo-ExtraBold.ttf"),
    loadFont("Inter-ExtraBold.ttf"),
    loadFont("Inter-Regular.ttf"),
  ]);

  const fonts = [
    { name: "Archivo", data: archivo800, weight: 800 as const, style: "normal" as const },
    { name: "Inter", data: inter800, weight: 800 as const, style: "normal" as const },
    { name: "Inter", data: inter400, weight: 400 as const, style: "normal" as const },
  ];

  // Token inválido/revocado: imagen genérica de marca (sin datos).
  if (!summary) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            backgroundColor: BRAND_BLACK,
            fontFamily: "Inter",
          }}
        >
          <Mark size={120} />
          <Wordmark fontSize={72} />
        </div>
      ),
      { ...size, fonts }
    );
  }

  const statItems = [
    { label: "paquetes", value: String(summary.packages) },
    { label: "días", value: String(summary.daysWorked) },
    {
      label: "por hora",
      value:
        summary.perHourCents !== null
          ? `${formatCurrency(summary.perHourCents / 100)}`
          : "—",
    },
    {
      label: "racha",
      value: summary.streak > 0 ? `${summary.streak} 🔥` : "—",
    },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: BRAND_BLACK,
          padding: "64px 80px",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Mark size={56} />
          <Wordmark fontSize={46} />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 30, color: "#a1a1aa" }}>
            {summary.ownerName
              ? `La semana de ${summary.ownerName} · ${formatDate(summary.weekStart)} – ${formatDate(summary.weekEnd)}`
              : `Semana del ${formatDate(summary.weekStart)} al ${formatDate(summary.weekEnd)}`}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 130,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: BRAND_GREEN,
              marginTop: 8,
            }}
          >
            {formatCurrency(summary.incomeCents / 100)}
          </div>
        </div>

        <div style={{ display: "flex", gap: 48 }}>
          {statItems.map((item) => (
            <div
              key={item.label}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 44,
                  fontWeight: 800,
                  color: "#fafafa",
                }}
              >
                {item.value}
              </div>
              <div style={{ display: "flex", fontSize: 24, color: "#a1a1aa" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
