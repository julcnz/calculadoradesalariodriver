"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  Receipt,
  Route,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/registros", label: "Registros", icon: ClipboardList },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  { href: "/rutas", label: "Rutas", icon: Route },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/configuracion", label: "Ajustes", icon: Settings },
];

// Mientras ESTE enlace navega, el ícono se reemplaza por un asterisco
// girando (estilo spinner de Claude). Aparece con 100ms de retraso para
// no parpadear en navegaciones instantáneas.
function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
  const { pending } = useLinkStatus();

  if (pending) {
    return (
      <span
        aria-hidden
        className="flex size-5 items-center justify-center opacity-0 [animation:nav-loading-in_150ms_100ms_forwards]"
      >
        <span className="animate-spin text-[17px] leading-none motion-reduce:animate-pulse">
          ✻
        </span>
      </span>
    );
  }
  return <Icon className="size-5" aria-hidden />;
}

export function AppNavDesktop() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {navItems.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith(href)
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AppNavMobile() {
  const pathname = usePathname();
  return (
    // Safe areas de iOS (HIG): el contenedor absorbe el home indicator
    // (inset-bottom) y las esquinas redondeadas en horizontal (left/right).
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="grid grid-cols-6">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <NavIcon icon={icon} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
