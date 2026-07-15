import { headers } from "next/headers";

// Limitador de ventana deslizante en memoria, por clave (normalmente IP).
// Suficiente para frenar fuerza bruta en el MVP. En serverless cada instancia
// tiene su propia memoria: es una protección parcial pero útil; para un
// límite global usar Upstash/Redis más adelante.
const buckets = new Map<string, number[]>();
const MAX_KEYS = 10_000;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();

  if (buckets.size > MAX_KEYS) {
    for (const [k, hits] of buckets) {
      if (hits.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }

  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

export async function clientIp(): Promise<string> {
  const headerList = await headers();
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "local"
  );
}

export const RATE_LIMIT_MESSAGE =
  "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.";
