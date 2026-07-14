import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Chequeo optimista de sesión (Next 16: proxy.ts reemplaza a middleware.ts).
// La verificación real de sesión vive en el layout de (app) y en las Server Actions.
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAuthPage =
    nextUrl.pathname === "/login" || nextUrl.pathname === "/registro";

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
  // Excluye API, estáticos y archivos de la PWA.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|sw\\.js|icons/).*)",
  ],
};
