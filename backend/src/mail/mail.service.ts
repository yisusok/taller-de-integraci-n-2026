import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private etherealAccount: nodemailer.TestAccount | null = null;

  constructor() {}

  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT
      ? parseInt(process.env.SMTP_PORT, 10)
      : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      this.logger.log(
        `Configurando transporte SMTP real hacia ${host}:${port} (${user})`,
      );
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      return this.transporter;
    }

    // Si no hay configuración SMTP en .env, creamos una cuenta real de pruebas en Ethereal
    this.logger.log(
      'SMTP no configurado en .env. Creando cuenta de correo de prueba real en Ethereal...',
    );
    try {
      this.etherealAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: this.etherealAccount.user,
          pass: this.etherealAccount.pass,
        },
      });
      this.logger.log(`Cuenta Ethereal activa: ${this.etherealAccount.user}`);
      return this.transporter;
    } catch (error: unknown) {
      this.logger.error('No se pudo inicializar transporte SMTP:', error);
      throw error;
    }
  }

  async sendMail(
    options: SendMailOptions,
  ): Promise<{ messageId: string; previewUrl?: string | false }> {
    const transporter = await this.getTransporter();
    const from =
      process.env.MAIL_FROM ||
      (this.etherealAccount
        ? `"E-Commerce" <${this.etherealAccount.user}>`
        : '"E-Commerce" <no-reply@ecommerce.local>');

    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      this.logger.log(
        `\n📬 ================= EMAIL ENVIADO (ETHEREAL) =================`,
      );
      this.logger.log(`Destinatario: ${options.to}`);
      this.logger.log(`Asunto:       ${options.subject}`);
      this.logger.log(`Bandeja Web:  ${previewUrl}`);
      this.logger.log(
        `===============================================================\n`,
      );
    } else {
      this.logger.log(
        `Correo enviado exitosamente a ${options.to} (MessageId: ${info.messageId})`,
      );
    }

    return {
      messageId: info.messageId,
      previewUrl,
    };
  }

  async sendPasswordResetEmail(
    to: string,
    token: string,
  ): Promise<{ previewUrl?: string | false }> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px; color: #111827; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #111827; margin-bottom: 20px; text-transform: uppercase; }
    .title { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 12px 0; }
    .text { font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 20px 0; }
    .btn { display: inline-block; background-color: #111827; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 8px 0 24px 0; }
    .warning { font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px; line-height: 1.5; }
    .link-alt { word-break: break-all; color: #2563eb; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">E-Commerce</div>
    <h2 class="title">Recuperación de Contraseña</h2>
    <p class="text">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón a continuación para crear una nueva contraseña:</p>
    <div>
      <a href="${resetLink}" class="btn" target="_blank">Restablecer mi contraseña</a>
    </div>
    <p class="text">Este enlace es temporal y expirará en <strong>15 minutos</strong> por motivos de seguridad.</p>
    <div class="warning">
      Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura. Tu contraseña actual no será modificada.<br><br>
      Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
      <a href="${resetLink}" class="link-alt">${resetLink}</a>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
E-Commerce — Recuperación de Contraseña

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
Ingresa al siguiente enlace para crear una nueva contraseña (válido por 15 minutos):

${resetLink}

Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
    `;

    const res = await this.sendMail({
      to,
      subject: 'Recuperación de contraseña — E-Commerce',
      html,
      text,
    });

    return { previewUrl: res.previewUrl };
  }
}
