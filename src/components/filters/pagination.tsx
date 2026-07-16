import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PAGE_SIZE = 20;

function buildHref(
  basePath: string,
  params: Record<string, string | undefined>,
  pagina: number
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  if (pagina > 1) query.set("pagina", String(pagina));
  const qs = query.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({
  basePath,
  params,
  pagina,
  total,
  label,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  pagina: number;
  total: number;
  label: string; // ej. "registros"
}) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (total <= PAGE_SIZE) {
    return (
      <p className="text-xs text-muted-foreground">
        {total} {label}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground">
        Página {pagina} de {totalPages} · {total} {label}
      </p>
      <div className="flex items-center gap-1">
        <Button
          asChild={pagina > 1}
          variant="outline"
          size="icon"
          disabled={pagina <= 1}
          aria-label="Página anterior"
        >
          {pagina > 1 ? (
            <Link href={buildHref(basePath, params, pagina - 1)}>
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </Button>
        <Button
          asChild={pagina < totalPages}
          variant="outline"
          size="icon"
          disabled={pagina >= totalPages}
          aria-label="Página siguiente"
        >
          {pagina < totalPages ? (
            <Link href={buildHref(basePath, params, pagina + 1)}>
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
