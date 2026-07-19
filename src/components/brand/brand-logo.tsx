import { cn } from "@/lib/utils";

// Marca oficial: pin de ubicación + moneda $ — verde #4ade80 sobre #0a0a0a
// (colores fijos de marca, no siguen el tema). Fuente del wordmark: Archivo
// ExtraBold (--font-archivo). Assets originales en public/icons y src/app.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={cn("size-6 shrink-0", className)} aria-hidden>
      <path
        d="M28 4 C15.85 4 6 13.85 6 26 C6 38 20 48 28 53 C36 48 50 38 50 26 C50 13.85 40.15 4 28 4 Z"
        fill="#4ade80"
      />
      <circle cx="28" cy="25" r="14" fill="#0a0a0a" />
      <path
        d="M27 14.5 h2.4 v2.6 c2.9.4 4.9 2.2 5.1 4.9 h-3.3 c-.2-1.3-1.3-2.1-3-2.1-1.7 0-2.7.8-2.7 1.9 0 1.1.8 1.6 2.8 2.1l1.9.45c3.2.75 4.8 2.1 4.8 4.6 0 2.7-2 4.5-5 4.9 v2.65 h-2.4 v-2.6 c-3.1-.4-5.2-2.3-5.35-5.1 h3.3 c.2 1.5 1.5 2.4 3.5 2.4 1.9 0 3.1-.85 3.1-2.05 0-1.1-.8-1.75-2.9-2.25l-1.9-.45c-3-.7-4.6-2-4.6-4.4 0-2.6 2-4.3 4.85-4.75 v-2.65 z"
        fill="#4ade80"
      />
    </svg>
  );
}

// "Calculator" usa el verde de marca en oscuro; en claro baja a green-600
// para mantener contraste sobre fondo blanco (#4ade80 no llega a AA en claro).
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-[family-name:var(--font-archivo)] font-extrabold tracking-[-0.02em]",
        className
      )}
    >
      Driver
      <span className="text-green-600 dark:text-[#4ade80]">Calculator</span>
    </span>
  );
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <BrandMark />
      <BrandWordmark className="text-[15px]" />
    </span>
  );
}
