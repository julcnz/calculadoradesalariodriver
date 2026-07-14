import { z } from "zod";

// Valor monetario ingresado como texto: "1.45" o "1,45".
export const moneyStringSchema = z
  .string()
  .trim()
  .regex(/^\d{1,7}([.,]\d{1,2})?$/, "Ingresa un valor válido (ej. 1.45)")
  .transform((value) => value.replace(",", "."));

export const rateTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre de la tarifa es obligatorio")
    .max(50, "El nombre es demasiado largo"),
  amount: moneyStringSchema,
});

export const createRouteSchema = z.object({
  companyId: z.string().min(1, "Elige una empresa"),
  name: z
    .string()
    .trim()
    .min(1, "El nombre de la ruta es obligatorio")
    .max(100, "El nombre es demasiado largo"),
  rates: z
    .array(rateTypeSchema)
    .min(1, "Agrega al menos una tarifa")
    .max(20, "Demasiadas tarifas"),
});

export const updateRouteSchema = z.object({
  id: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, "El nombre de la ruta es obligatorio")
    .max(100, "El nombre es demasiado largo"),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
