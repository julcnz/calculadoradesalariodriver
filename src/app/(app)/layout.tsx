import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppNavDesktop, AppNavMobile } from "@/components/layout/app-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Datos frescos de la BD: refleja ediciones de perfil al instante y
  // expulsa sesiones de cuentas suspendidas en cualquier dispositivo.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUpdatedAt: true,
      suspendedAt: true,
    },
  });
  if (!user || user.suspendedAt) {
    redirect("/login");
  }

  const avatarUrl = user.avatarUpdatedAt
    ? `/api/avatar/${user.id}?v=${user.avatarUpdatedAt.getTime()}`
    : null;

  return (
    <div className="flex min-h-dvh flex-col">
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
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
      <AppNavMobile />
    </div>
  );
}
