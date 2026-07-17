import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Calculadora de Salario Driver",
    short_name: "Salario Driver",
    description:
      "Registra tu trabajo diario como conductor de reparto y calcula tus ganancias.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    // iOS/Android hornean este color al instalar; en runtime lo gobierna
    // <ThemeColorSync/>. Debe coincidir con background_color (tema claro).
    theme_color: "#ffffff",
    lang: "es",
    shortcuts: [
      {
        name: "Nuevo registro",
        url: "/registros/nuevo",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Nuevo gasto",
        url: "/gastos/nuevo",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
