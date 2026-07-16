import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppNavDesktop, AppNavMobile } from "@/components/layout/app-nav";
import { OfflineSyncer } from "@/components/layout/offline-syncer";
import { TimezoneSync } from "@/components/layout/timezone-sync";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { VerifyEmailBanner } from "@/components/layout/verify-email-banner";

// La actividad de la sesión se actualiza como mucho cada 10 minutos.
const ACTIVITY_THROTTLE_MS = 10 * 60 * 1000;

async function touchSessionActivity(deviceSession: {
  id: string;
  lastActiveAt: Date;
}) {
  if (
    Date.now() - deviceSession.lastActiveAt.getTime() <=
    ACTIVITY_THROTTLE_MS
  ) {
    return;
  }
  await prisma.userSession.update({
    where: { id: deviceSession.id },
    data: { lastActiveAt: new Date() },
  });
}

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  // Sesiones antiguas sin registro de dispositivo: forzar re-login.
  const sessionId = session.user.sessionId;
  if (!sessionId) {
    redirect("/api/salir");
  }

  // Datos frescos de la BD: refleja ediciones de perfil al instante y
  // expulsa sesiones suspendidas o revocadas en cualquier dispositivo.
  const [user, deviceSession] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUpdatedAt: true,
        suspendedAt: true,
        emailVerifiedAt: true,
      },
    }),
    prisma.userSession.findUnique({ where: { id: sessionId } }),
  ]);
  if (!user || user.suspendedAt || !deviceSession || deviceSession.revokedAt) {
    // Hay que LIMPIAR la cookie, no solo redirigir (evita bucle con el proxy).
    redirect("/api/salir");
  }

  await touchSessionActivity(deviceSession);

  const avatarUrl = user.avatarUpdatedAt
    ? `/api/avatar/${user.id}?v=${user.avatarUpdatedAt.getTime()}`
    : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <TimezoneSync />
      <OfflineSyncer />
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-bold tracking-tight">
              💵 Salario Driver
            </Link>
            <AppNavDesktop />
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu
              name={user.name}
              email={user.email}
              avatarUrl={avatarUrl}
            />
          </div>
        </div>
      </header>
      {!user.emailVerifiedAt && <VerifyEmailBanner />}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
      <AppNavMobile />
    </div>
  );
}
