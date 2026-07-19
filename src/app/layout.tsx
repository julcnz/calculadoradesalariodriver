import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono, Inter } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeColorSync } from "@/components/theme/theme-color-sync";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// Solo para el wordmark de la marca (BrandWordmark).
const archivo = Archivo({
  subsets: ["latin"],
  weight: "800",
  variable: "--font-archivo",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
  title: {
    default: "Driver Calculator",
    template: "%s · Driver Calculator",
  },
  description:
    "Registra tu trabajo diario como conductor de reparto y calcula tus ganancias, gastos y métricas.",
  applicationName: "Driver Calculator",
  appleWebApp: {
    capable: true,
    // La app dibuja DETRÁS de la barra de estado; los safe-area insets
    // (env()) hacen el resto. Se ve nativa en claro y oscuro.
    statusBarStyle: "black-translucent",
    title: "Driver Calc",
  },
};

export const viewport: Viewport = {
  // theme-color NO se declara aquí: React 19 gestiona los metas que
  // renderiza Next y <ThemeColorSync/> necesita uno propio. Mutar o borrar
  // los de React crashea la navegación (removeChild sobre null) y obligaba
  // a tocar dos veces cada enlace.
  // Requisito de iOS: sin "cover", env(safe-area-inset-*) vale 0 y el
  // home indicator tapa la navegación inferior en la PWA instalada.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
        archivo.variable
      )}
    >
      <body className="flex min-h-full flex-col">
        <SerwistProvider swUrl="/serwist/sw.js">
          <ThemeProvider>
            <ThemeColorSync />
            {children}
          </ThemeProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
