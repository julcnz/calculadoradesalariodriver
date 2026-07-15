import { z } from "zod";
import { passwordSchema } from "@/lib/validations/auth";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .max(100, "El nombre es demasiado largo")
    .optional()
    .or(z.literal("")),
  email: z.email("Ingresa un email válido"),
});

// Data URL de imagen ya reescalada en el cliente (256px).
// Límite generoso por si el recorte cliente falla: ~600 KB de base64.
export const avatarDataUrlSchema = z
  .string()
  .regex(
    /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/,
    "Formato de imagen no válido"
  )
  .max(600_000, "La imagen es demasiado grande");

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
