import type { Metadata } from "next";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { describeUserAgent, isMobileUserAgent } from "@/lib/device";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { SessionsCard } from "@/components/profile/sessions-card";
import { SuspendAccountButton } from "@/components/profile/suspend-account";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const { userId, sessionId } = await requireSession();

  const [user, sessions] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUpdatedAt: true },
    }),
    prisma.userSession.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastActiveAt: "desc" },
      take: 10,
    }),
  ]);

  const avatarUrl = user.avatarUpdatedAt
    ? `/api/avatar/${user.id}?v=${user.avatarUpdatedAt.getTime()}`
    : null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">
          Tu foto, tus datos y la seguridad de tu cuenta.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foto de perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUploader avatarUrl={avatarUrl} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información personal</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm name={user.name} email={user.email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contraseña</CardTitle>
          <CardDescription>
            Al cambiarla se cerrarán las sesiones de tus otros dispositivos.
            Si la olvidas, recupérala desde “¿Olvidaste tu contraseña?” en el
            inicio de sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dispositivos y sesiones</CardTitle>
          <CardDescription>
            Dónde has iniciado sesión y cuándo fue la última actividad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionsCard
            sessions={sessions.map((s) => ({
              id: s.id,
              device: describeUserAgent(s.userAgent),
              isMobile: isMobileUserAgent(s.userAgent),
              ip: s.ip,
              createdAt: s.createdAt.toISOString(),
              lastActiveAt: s.lastActiveAt.toISOString(),
              isCurrent: s.id === sessionId,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exportar mis datos</CardTitle>
          <CardDescription>
            Descarga todos tus registros y gastos. El Excel incluye el detalle
            de tarifas de cada día.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/api/exportar?formato=xlsx">
              <Download className="size-4" />
              Excel completo
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/api/exportar?formato=csv&tipo=registros">
              <Download className="size-4" />
              Registros (CSV)
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/api/exportar?formato=csv&tipo=gastos">
              <Download className="size-4" />
              Gastos (CSV)
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Zona de peligro</CardTitle>
          <CardDescription>
            Suspende tu cuenta si quieres dejar de usar la app por un tiempo.
            Tus datos no se borran y puedes reactivarla iniciando sesión de
            nuevo. Si pasa 3 meses suspendida, la cuenta y sus datos se
            eliminan definitivamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SuspendAccountButton />
        </CardContent>
      </Card>
    </div>
  );
}
