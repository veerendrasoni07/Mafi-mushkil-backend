import nodemailer, { Transporter } from 'nodemailer';

export interface EmailResult {
  delivered: boolean;
  messageId?: string;
  simulated?: boolean;
  reason?: string;
}

export class EmailService {
  private static transporter: Transporter | null = null;

  private static getTransporter(): Transporter | null {
    if (this.transporter) {
      return this.transporter;
    }

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      return this.transporter;
    }

    return null;
  }

  static async sendEngineerWelcome(options: {
    email: string;
    name: string;
    temporaryPassword: string;
  }): Promise<EmailResult> {
    const { email, name, temporaryPassword } = options;
    const from = process.env.EMAIL_FROM || '"Mafi Mushkil Admin" <noreply@mafimushkil.com>';
    const subject = 'Welcome to Mafi Mushkil - Your Engineer Account Credentials';
    const text = `Hello ${name},

An engineer account has been created for you on Mafi Mushkil.

Login Credentials:
Email: ${email}
Temporary Password: ${temporaryPassword}

For security, you will be required to change your password immediately upon your first login.

Best regards,
Mafi Mushkil Administration Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2>Welcome to Mafi Mushkil</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>An engineer account has been created for you on the Mafi Mushkil service platform.</p>
        <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="font-size: 16px; background: #e0e0e0; padding: 2px 6px; border-radius: 4px;">${temporaryPassword}</code></p>
        </div>
        <p><strong>Important:</strong> You must change this temporary password immediately after logging in before you can access assigned tasks.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
        <p style="font-size: 12px; color: #777;">Mafi Mushkil Operations &bull; All services. One app.</p>
      </div>
    `;

    const transporter = this.getTransporter();
    if (!transporter) {
      console.log(`[EmailService] SMTP not configured. Simulated Engineer Welcome email to ${email}`);
      console.log(`[EmailService] Temporary Password for ${email}: ${temporaryPassword}`);
      return {
        delivered: false,
        simulated: true,
        reason: 'SMTP server is not configured in environment variables.',
      };
    }

    try {
      const info = await transporter.sendMail({
        from,
        to: email,
        subject,
        text,
        html,
      });
      return { delivered: true, messageId: info.messageId };
    } catch (err: any) {
      console.error(`[EmailService] Failed to send email to ${email}:`, err.message);
      return { delivered: false, reason: err.message };
    }
  }

  static async sendPasswordReset(options: {
    email: string;
    name: string;
    resetToken: string;
  }): Promise<EmailResult> {
    const { email, name, resetToken } = options;
    const from = process.env.EMAIL_FROM || '"Mafi Mushkil Security" <noreply@mafimushkil.com>';
    const subject = 'Password Reset Request - Mafi Mushkil';
    const text = `Hello ${name},

We received a request to reset your password for your Mafi Mushkil account.

Your Password Reset Code / Token:
${resetToken}

This token will expire in 15 minutes. If you did not request this, please ignore this email.

Best regards,
Mafi Mushkil Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2>Password Reset Request</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We received a request to reset your password. Use the following reset token in the app to set a new password:</p>
        <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <span style="font-size: 20px; font-weight: bold; letter-spacing: 2px;">${resetToken}</span>
        </div>
        <p>This code will expire in <strong>15 minutes</strong>.</p>
        <p>If you did not make this request, you can safely ignore this email.</p>
      </div>
    `;

    const transporter = this.getTransporter();
    if (!transporter) {
      console.log(`[EmailService] SMTP not configured. Simulated Password Reset to ${email}`);
      console.log(`[EmailService] Reset Token for ${email}: ${resetToken}`);
      return {
        delivered: false,
        simulated: true,
        reason: 'SMTP server is not configured in environment variables.',
      };
    }

    try {
      const info = await transporter.sendMail({
        from,
        to: email,
        subject,
        text,
        html,
      });
      return { delivered: true, messageId: info.messageId };
    } catch (err: any) {
      console.error(`[EmailService] Failed to send reset email to ${email}:`, err.message);
      return { delivered: false, reason: err.message };
    }
  }
}
