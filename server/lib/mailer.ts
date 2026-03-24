import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_NAME = process.env.MAIL_FROM_NAME || 'Family Budget';
const FROM_EMAIL = process.env.SMTP_USER || 'noreply@familybudget.app';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailOptions): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[MAILER] SMTP non configurato — email non inviata a:', to);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`[MAILER] Email inviata a: ${to}`);
    return true;
  } catch (error) {
    console.error('[MAILER] Errore invio email:', error);
    return false;
  }
}

export function buildInviteEmail(inviteUrl: string, familyName: string, inviterName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px 24px;text-align:center;">
      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:24px;">👨‍👩‍👧‍👦</span>
      </div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">Sei stato invitato!</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px 24px;">
      <p style="color:#27272a;font-size:15px;line-height:1.6;margin:0 0 8px;">
        <strong>${inviterName}</strong> ti ha invitato a unirti alla famiglia
      </p>
      <p style="color:#7c3aed;font-size:20px;font-weight:700;margin:0 0 24px;">
        ${familyName}
      </p>
      <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 28px;">
        Accetta l'invito per iniziare a gestire il budget familiare insieme. Potrete monitorare le spese, impostare limiti per categoria e tenere tutto sotto controllo.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${inviteUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:12px;">
          Accetta invito
        </a>
      </div>

      <!-- Link fallback -->
      <p style="color:#a1a1aa;font-size:11px;line-height:1.5;margin:0;word-break:break-all;">
        Se il pulsante non funziona, copia questo link nel browser:<br>
        <a href="${inviteUrl}" style="color:#7c3aed;">${inviteUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:20px 24px;background:#fafafa;border-top:1px solid #f4f4f5;text-align:center;">
      <p style="color:#a1a1aa;font-size:11px;margin:0;">
        L'invito scade tra 7 giorni. Se non hai richiesto questo invito, puoi ignorare questa email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function build2FAEmail(code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

    <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px 24px;text-align:center;">
      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:24px;">🔐</span>
      </div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">Codice di verifica</h1>
    </div>

    <div style="padding:32px 24px;text-align:center;">
      <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Usa questo codice per completare l'accesso:
      </p>
      <div style="background:#f4f4f5;border-radius:12px;padding:20px;margin-bottom:24px;">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#27272a;font-family:monospace;">${code}</span>
      </div>
      <p style="color:#a1a1aa;font-size:12px;margin:0;">
        Il codice scade tra 10 minuti. Se non hai richiesto l'accesso, ignora questa email.
      </p>
    </div>

    <div style="padding:20px 24px;background:#fafafa;border-top:1px solid #f4f4f5;text-align:center;">
      <p style="color:#a1a1aa;font-size:11px;margin:0;">Family Budget</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
