// Envío de correos. Con RESEND_API_KEY configurada usa Resend
// (https://resend.com); sin ella, imprime el contenido en la consola del
// servidor — suficiente para desarrollo local.

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

// Plantilla HTML simple con botón: los clientes de correo parten las URLs
// largas en texto plano (Gmail truncó tokens reales), un <a href> nunca.
export function emailLayout(
  title: string,
  bodyLines: string[],
  ctaLabel: string,
  ctaUrl: string
): string {
  const paragraphs = bodyLines
    .map(
      (line) =>
        `<p style="color:#525252;font-size:14px;line-height:1.6;margin:0 0 12px">${line}</p>`
    )
    .join("");
  return `<!doctype html><html><body style="font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;padding:24px;margin:0">
<div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px">
<p style="font-weight:800;font-size:15px;letter-spacing:-0.02em;margin:0 0 16px;color:#0a0a0a">Salario<span style="color:#16a34a">Driver</span></p>
<h1 style="font-size:20px;margin:0 0 12px;color:#0a0a0a">${title}</h1>
${paragraphs}
<a href="${ctaUrl}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;margin:12px 0">${ctaLabel}</a>
<p style="color:#a3a3a3;font-size:12px;line-height:1.6;margin:16px 0 0">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><a href="${ctaUrl}" style="color:#525252;word-break:break-all">${ctaUrl}</a></p>
</div></body></html>`;
}

export async function sendEmail({ to, subject, text, html }: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      [
        "",
        "════════════════════════════════════════════════════════",
        "📧 CORREO SIMULADO (configura RESEND_API_KEY para enviar)",
        `Para: ${to}`,
        `Asunto: ${subject}`,
        "",
        text,
        "════════════════════════════════════════════════════════",
        "",
      ].join("\n")
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    }),
  });

  if (!response.ok) {
    console.error("Error enviando correo:", await response.text());
  }
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  await sendEmail({
    to,
    subject: "Verifica tu email — Calculadora de Salario Driver",
    text: [
      "¡Bienvenido!",
      "",
      "Confirma que este email es tuyo abriendo este enlace (expira en 24 horas):",
      "",
      verifyUrl,
      "",
      "Si no creaste una cuenta, puedes ignorar este correo.",
    ].join("\n"),
    html: emailLayout(
      "¡Bienvenido!",
      [
        "Confirma que este email es tuyo con el botón de abajo. El enlace expira en 24 horas.",
        "Si no creaste una cuenta, puedes ignorar este correo.",
      ],
      "Verificar mi email",
      verifyUrl
    ),
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendEmail({
    to,
    subject: "Restablece tu contraseña — Calculadora de Salario Driver",
    text: [
      "Hola,",
      "",
      "Recibimos una solicitud para restablecer tu contraseña.",
      "Abre este enlace para elegir una nueva (expira en 1 hora):",
      "",
      resetUrl,
      "",
      "Si no fuiste tú, ignora este correo: tu contraseña no cambia.",
    ].join("\n"),
    html: emailLayout(
      "Restablece tu contraseña",
      [
        "Recibimos una solicitud para restablecer tu contraseña. El enlace expira en 1 hora.",
        "Si no fuiste tú, ignora este correo: tu contraseña no cambia.",
      ],
      "Elegir nueva contraseña",
      resetUrl
    ),
  });
}
