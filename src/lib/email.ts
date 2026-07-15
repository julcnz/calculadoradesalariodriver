// Envío de correos. Con RESEND_API_KEY configurada usa Resend
// (https://resend.com); sin ella, imprime el contenido en la consola del
// servidor — suficiente para desarrollo local.

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail({ to, subject, text }: EmailPayload) {
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
    }),
  });

  if (!response.ok) {
    console.error("Error enviando correo:", await response.text());
  }
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
  });
}
