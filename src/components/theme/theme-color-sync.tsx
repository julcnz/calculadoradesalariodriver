"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

// iOS tiñe la barra de estado con <meta name="theme-color">. Los metas por
// media query siguen al SISTEMA, pero nuestro tema lo elige el usuario
// (next-themes): si el teléfono está oscuro y la app en claro, la barra
// salía gris. Aquí la sincronizamos con el tema REAL de la app.
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    const color = resolvedTheme === "dark" ? "#0a0a0a" : "#ffffff";

    const metas = document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach((meta, index) => {
      if (index === 0) {
        meta.removeAttribute("media");
        meta.setAttribute("content", color);
      } else {
        meta.remove();
      }
    });
    if (metas.length === 0) {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      meta.setAttribute("content", color);
      document.head.appendChild(meta);
    }
  }, [resolvedTheme]);

  return null;
}
