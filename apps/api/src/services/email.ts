// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Email Service  |  Nodemailer + Postmark SMTP
// ─────────────────────────────────────────────────────────────────────────────

import nodemailer from 'nodemailer';
import logger from '../lib/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.postmarkapp.com',
  port: parseInt(process.env.SMTP_PORT ?? '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER ?? process.env.POSTMARK_API_KEY ?? '',
    pass: process.env.SMTP_PASS ?? process.env.POSTMARK_API_KEY ?? '',
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL ?? 'noreply@cylive.com';
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://cylive.com';

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"CY Live" <${FROM_EMAIL}>`,
    to,
    subject: 'Verify your CY Live email',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Welcome to CY Live!</h1>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 32px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #6b7280; font-size: 14px;">Or copy this link: ${verifyUrl}</p>
        <p style="color: #6b7280; font-size: 12px;">If you didn't create this account, you can safely ignore this email.</p>
      </div>
    `,
  });

  logger.info({ to }, 'Verification email sent');
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"CY Live" <${FROM_EMAIL}>`,
    to,
    subject: 'Reset your CY Live password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Password Reset</h1>
        <p>You requested a password reset. Click below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #6b7280; font-size: 14px;">This link expires in 30 minutes.</p>
        <p style="color: #6b7280; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  logger.info({ to }, 'Password reset email sent');
}

export async function sendWelcomeEmail(to: string, displayName: string) {
  await transporter.sendMail({
    from: `"CY Live" <${FROM_EMAIL}>`,
    to,
    subject: 'Welcome to CY Live! 🎬',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Hey ${displayName}!</h1>
        <p>Welcome to CY Live — the next-gen live streaming platform for creators.</p>
        <p>Here's what you can do:</p>
        <ul>
          <li>🎥 Go live with multi-platform streaming</li>
          <li>💰 Monetize with super chats, tips & subscriptions</li>
          <li>🤖 Chat with Aura AI assistant</li>
          <li>🎉 Host watch parties with friends</li>
        </ul>
        <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 32px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Go to Dashboard
        </a>
      </div>
    `,
  });
}

export async function sendTransactionReceipt(
  to: string,
  data: { type: string; amount: number; creatorName: string },
) {
  await transporter.sendMail({
    from: `"CY Live" <${FROM_EMAIL}>`,
    to,
    subject: `CY Live — Receipt for your ${data.type}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Transaction Receipt</h1>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Type</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.type}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Amount</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">$${data.amount.toFixed(2)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Creator</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.creatorName}</td></tr>
        </table>
        <p style="color: #6b7280; font-size: 12px;">Thank you for supporting creators on CY Live!</p>
      </div>
    `,
  });
}
