import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { ProfileForm } from "@/components/profile/profile-form";
import { SuspendAccountButton } from "@/components/profile/suspend-account";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const userId = await requireUserId();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatarUpdatedAt: true },
  });

  const avatarUrl = user.avatarUpdatedAt
    ? `/api/avatar/${user.id}?v=${user.avatarUpdatedAt.getTime()}`
    : null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">
          Tu foto y tus datos personales.
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

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Zona de peligro</CardTitle>
          <CardDescription>
            Suspende tu cuenta si quieres dejar de usar la app por un tiempo.
            Tus datos no se borran y puedes reactivarla iniciando sesión de
            nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SuspendAccountButton />
        </CardContent>
      </Card>
    </div>
  );
}
