import { z } from "zod";
import { passwordSchema } from "@/lib/validations/auth";

export const requestResetSchema = z.object({
  email: z.email("Ingresa un email válido"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
