import { signOut } from "@/lib/auth";

// Cierra la sesión y limpia la cookie. El layout de (app) redirige aquí
// cuando la sesión apunta a un usuario inexistente o suspendido — redirigir
// directo a /login dejaría la cookie viva y el proxy devolvería al usuario
// a /dashboard en un bucle infinito.
export async function GET() {
  await signOut({ redirectTo: "/login" });
}
