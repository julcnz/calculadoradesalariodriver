import { z } from "zod";

export const createCompanySchema = z.object({
  // Nombre elegido del listado, o el texto libre si eligió "Otra".
  name: z
    .string()
    .trim()
    .min(1, "El nombre de la empresa es obligatorio")
    .max(100, "El nombre es demasiado largo"),
  isCustom: z.boolean(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
