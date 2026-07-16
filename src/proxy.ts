import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Chequeo optimista de sesión (Next 16: proxy.ts reemplaza a middleware.ts).
// La verificación real de sesión vive en el layout de (app) y en las Server Actions.
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  // La raíz es la landing pública: visible sin sesión; con sesión → dashboard.
  const isAuthPage =
    nextUrl.pathname === "/" ||
    nextUrl.pathname === "/login" ||
    nextUrl.pathname === "/registro" ||
    nextUrl.pathname === "/recuperar" ||
    nextUrl.pathname.startsWith("/restablecer") ||
    nextUrl.pathname.startsWith("/verificar");

  // /verificar debe funcionar también con sesión iniciada (clic desde el correo).
  if (nextUrl.pathname.startsWith("/verificar")) {
    return NextResponse.next();
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  if (!isAuthPage && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  // Excluye API, estáticos y archivos de la PWA (service worker, manifest, iconos).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|serwist/|~offline|icons/).*)",
  ],
};
