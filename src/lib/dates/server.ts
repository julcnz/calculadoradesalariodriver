import { cookies } from "next/headers";
import { todayInTimeZone } from "@/lib/dates/week";

// "Hoy" según la zona horaria del navegador del usuario (cookie `tz`,
// mantenida por <TimezoneSync/>). Sin cookie: zona del servidor.
export async function todayForUser(): Promise<Date> {
  const cookieStore = await cookies();
  return todayInTimeZone(cookieStore.get("tz")?.value);
}
