"use client";

import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { logoutUser } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  name,
  email,
  avatarUrl,
}: {
  name?: string | null;
  email: string;
  avatarUrl?: string | null;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Menú de usuario">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar servido por nuestra propia API, sin optimizador
            <img
              src={avatarUrl}
              alt="Foto de perfil"
              className="size-7 rounded-full object-cover"
            />
          ) : (
            <UserRound className="size-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{name ?? "Conductor"}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/perfil">
            <UserRound className="size-4" />
            Mi perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => logoutUser()}>
          <LogOut className="size-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
