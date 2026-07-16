import { z } from "zod";
import { TIME_REGEX } from "@/lib/dates/time";

const optionalTime = z
  .string()
  .regex(TIME_REGEX, "Hora inválida (formato HH:MM)")
  .optional()
  .or(z.literal(""));

// Regla 2: millas y horas son OPCIONALES. Vacío → null, nunca 0.
const optionalMiles = z
  .string()
  .trim()
  .regex(/^\d{1,6}([.,]\d{1,2})?$/, "Ingresa un número válido de millas")
  .transform((value) => value.replace(",", "."))
  .optional()
  .or(z.literal(""));

// Lectura de odómetro (hasta 1 decimal). Alternativa a las millas manuales.
const optionalOdometer = z
  .string()
  .trim()
  .regex(/^\d{1,8}([.,]\d)?$/, "Lectura de odómetro inválida")
  .transform((value) => value.replace(",", "."))
  .optional()
  .or(z.literal(""));

const baseWorkLogFields = {
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  startTime: optionalTime,
  endTime: optionalTime,
  miles: optionalMiles,
  odometerStart: optionalOdometer,
  odometerEnd: optionalOdometer,
  note: z.string().trim().max(500, "La nota es demasiado larga").optional(),
};

const timesRefinement = (data: {
  startTime?: string;
  endTime?: string;
}): boolean => {
  const hasStart = Boolean(data.startTime);
  const hasEnd = Boolean(data.endTime);
  return hasStart === hasEnd; // ambas o ninguna
};

const odometerRefinement = (data: {
  odometerStart?: string;
  odometerEnd?: string;
}): boolean => {
  const hasStart = Boolean(data.odometerStart);
  const hasEnd = Boolean(data.odometerEnd);
  if (hasStart !== hasEnd) return false; // ambas o ninguna
  if (!hasStart) return true;
  return Number(data.odometerEnd) >= Number(data.odometerStart);
};

const ODOMETER_ERROR = {
  message:
    "Para usar el odómetro llena inicio y fin, y el fin debe ser mayor o igual",
  path: ["odometerEnd"] as ["odometerEnd"],
};

export const createWorkLogSchema = z
  .object({
    routeId: z.string().min(1, "Elige una ruta"),
    ...baseWorkLogFields,
    quantities: z
      .array(
        z.object({
          rateTypeId: z.string().min(1),
          quantity: z
            .number()
            .int("Debe ser un número entero")
            .min(0, "No puede ser negativo")
            .max(10000, "Cantidad demasiado grande"),
        })
      )
      .min(1, "La ruta no tiene tarifas"),
  })
  .refine(timesRefinement, {
    message: "Ingresa la hora de inicio y la de fin (o deja ambas vacías)",
    path: ["endTime"],
  })
  .refine(odometerRefinement, ODOMETER_ERROR)
  .refine((data) => data.quantities.some((q) => q.quantity > 0), {
    message: "Registra al menos un paquete en alguna tarifa",
    path: ["quantities"],
  });

export const updateWorkLogSchema = z
  .object({
    id: z.string().min(1),
    ...baseWorkLogFields,
    entries: z
      .array(
        z.object({
          entryId: z.string().min(1),
          quantity: z
            .number()
            .int("Debe ser un número entero")
            .min(0, "No puede ser negativo")
            .max(10000, "Cantidad demasiado grande"),
        })
      )
      .min(1),
  })
  .refine(timesRefinement, {
    message: "Ingresa la hora de inicio y la de fin (o deja ambas vacías)",
    path: ["endTime"],
  })
  .refine(odometerRefinement, ODOMETER_ERROR);

export type CreateWorkLogInput = z.infer<typeof createWorkLogSchema>;
export type UpdateWorkLogInput = z.infer<typeof updateWorkLogSchema>;
