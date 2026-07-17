import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
    default: "Calculadora de Salario Driver",
    template: "%s · Calculadora de Salario Driver",
  },
  description:
    "Registra tu trabajo diario como conductor de reparto y calcula tus ganancias, gastos y métricas.",
  applicationName: "Salario Driver",
  appleWebApp: {
    capable: true,
    // La app dibuja DETRÁS de la barra de estado; los safe-area insets
    // (env()) hacen el resto. Se ve nativa en claro y oscuro.
    statusBarStyle: "black-translucent",
    title: "Salario Driver",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
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
        inter.variable
      )}
    >
      <body className="flex min-h-full flex-col">
        <SerwistProvider swUrl="/serwist/sw.js">
          <ThemeProvider>{children}</ThemeProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
