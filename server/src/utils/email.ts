import nodemailer from 'nodemailer';
import { logger } from '../lib/logger.js';

export async function sendPasswordResetEmail(
  toEmail: string,
  rawToken: string,
) {
  const clientUrl =
    process.env.CLIENT_URL ?? 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password?token=${rawToken}`;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT
    ? Number(process.env.SMTP_PORT)
    : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from =
    process.env.SMTP_FROM ?? 'noreply@taskflow.com';

  if (host && user && pass) {
    try {
      const transporter =
        nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass,
          },
        });

      await transporter.sendMail({
        from,
        to: toEmail,
        subject: 'TaskFlow Password Reset',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a;">
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your TaskFlow account.</p>
            <p>Click the link below to reset your password. This link expires in 30 minutes and can only be used once.</p>
            <p style="margin: 20px 0;">
              <a href="${resetLink}" style="background: #6366f1; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
            </p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
      return;
    } catch (error) {
      logger.error(
        error,
        'Failed to send password reset email via SMTP',
      );
    }
  }

  // Development / fallback logging when SMTP is not configured
  logger.info(
    `[Password Reset Email] To: ${toEmail} | Reset Link: ${resetLink}`,
  );
}
