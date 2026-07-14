import { z } from "zod";

// Regla 10: mínimo 8 caracteres, al menos una mayúscula y un número.
export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "La contraseña debe incluir al menos una mayúscula")
  .regex(/[0-9]/, "La contraseña debe incluir al menos un número");

export const loginSchema = z.object({
  email: z.email("Ingresa un email válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .max(100, "El nombre es demasiado largo")
      .optional()
      .or(z.literal("")),
    email: z.email("Ingresa un email válido"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
