import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Devuelve el id del usuario autenticado o redirige a /login.
// Úsalo en páginas y Server Actions de la zona (app).
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

// Igual que requireUserId pero incluye el id de la sesión del dispositivo
// (para excluirla al revocar "las demás sesiones").
export async function requireSession(): Promise<{
  userId: string;
  sessionId: string | null;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return {
    userId: session.user.id,
    sessionId: session.user.sessionId ?? null,
  };
}
