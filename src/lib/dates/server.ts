import { cookies } from "next/headers";
import { hourInTimeZone, todayInTimeZone } from "@/lib/dates/week";

// "Hoy" según la zona horaria del navegador del usuario (cookie `tz`,
// mantenida por <TimezoneSync/>). Sin cookie: zona del servidor.
export async function todayForUser(): Promise<Date> {
  const cookieStore = await cookies();
  return todayInTimeZone(cookieStore.get("tz")?.value);
}

// Hora local (0–23) del usuario, para el saludo del dashboard.
export async function currentHourForUser(): Promise<number> {
  const cookieStore = await cookies();
  return hourInTimeZone(cookieStore.get("tz")?.value);
}
