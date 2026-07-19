"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  Receipt,
  Route,
  Settings,
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

// En móvil solo 4 pestañas (HIG: ≤5): Rutas y Empresas viven dentro de
// Ajustes, así que esas rutas resaltan la pestaña Ajustes.
const MOBILE_HREFS = ["/dashboard", "/registros", "/gastos", "/configuracion"];
const mobileNavItems = navItems.filter((item) =>
  MOBILE_HREFS.includes(item.href)
);
const SETTINGS_CHILD_PREFIXES = ["/rutas", "/empresas", "/impuestos", "/guia", "/simulador"];

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
      <div className="grid grid-cols-4">
        {mobileNavItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname.startsWith(href) ||
            (href === "/configuracion" &&
              SETTINGS_CHILD_PREFIXES.some((p) => pathname.startsWith(p)));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
