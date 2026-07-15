import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ restablecida?: string }>;
}) {
  const { restablecida } = await searchParams;

  return (
    <LoginForm
      notice={
        restablecida
          ? "Tu contraseña se restableció correctamente. Ya puedes iniciar sesión."
          : undefined
      }
    />
  );
}
