"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

// iOS tiñe la barra de estado con <meta name="theme-color">. Los metas por
// media query siguen al SISTEMA, pero nuestro tema lo elige el usuario
// (next-themes): si el teléfono está oscuro y la app en claro, la barra
// salía gris. Aquí mantenemos UN meta propio sincronizado con el tema real.
//
// OJO: este meta lo creamos nosotros y React no lo conoce. Jamás mutar ni
// borrar metas renderizados por Next (viewport.themeColor): React 19 los
// gestiona y crashea la navegación (removeChild sobre null) si se tocan.
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    const color = resolvedTheme === "dark" ? "#0a0a0a" : "#ffffff";

    let meta = document.head.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"][data-theme-color-sync]'
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.setAttribute("data-theme-color-sync", "");
      document.head.appendChild(meta);
    }
    meta.content = color;
  }, [resolvedTheme]);

  return null;
}
