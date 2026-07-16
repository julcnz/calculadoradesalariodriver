// Descripción legible de un user-agent, sin librerías externas.
export function describeUserAgent(userAgent: string | null): string {
  if (!userAgent) return "Dispositivo desconocido";

  let browser = "Navegador";
  if (userAgent.includes("Edg/")) browser = "Edge";
  else if (userAgent.includes("OPR/")) browser = "Opera";
  else if (userAgent.includes("Chrome/")) browser = "Chrome";
  else if (userAgent.includes("Firefox/")) browser = "Firefox";
  else if (userAgent.includes("Safari/")) browser = "Safari";

  let os = "";
  if (userAgent.includes("iPhone")) os = "iPhone";
  else if (userAgent.includes("iPad")) os = "iPad";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac OS X")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";

  return os ? `${browser} · ${os}` : browser;
}

export function isMobileUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return /iPhone|Android.*Mobile|Mobile.*Android/.test(userAgent);
}
