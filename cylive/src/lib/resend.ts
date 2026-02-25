// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Resend Email Client
// Transactional email for verification, notifications, receipts
// ──────────────────────────────────────────────────────────────────────────────

import { Resend } from "resend";

let _resend: Resend | null = null;
export function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || "re_build_key");
  }
  return _resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@cylive.app";
const APP_NAME = "CYLive";

// ── Email Templates ─────────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, displayName: string) {
  return getResend().emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: `Welcome to ${APP_NAME}, ${displayName}!`,
    html: `
      <div style="font-family: 'Outfit', sans-serif; background: #03030A; color: #F0F0FF; padding: 40px; border-radius: 16px;">
        <h1 style="color: #FF1564; margin-bottom: 16px;">Welcome to CYLive 🎬</h1>
        <p>Hey ${displayName},</p>
        <p>You're now part of the creator economy's next evolution. Stream in multi-panel formats, earn 90% of all payments, and engage your audience with AI-powered tools.</p>
        <a href="${process.env.NEXTAUTH_URL}" style="display: inline-block; background: #FF1564; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 16px;">Enter the Grid</a>
      </div>
    `,
  });
}

export async function sendStreamScheduledEmail(
  email: string,
  creatorName: string,
  streamTitle: string,
  scheduledAt: string,
) {
  return getResend().emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: `🔴 ${creatorName} is going live: ${streamTitle}`,
    html: `
      <div style="font-family: 'Outfit', sans-serif; background: #03030A; color: #F0F0FF; padding: 40px; border-radius: 16px;">
        <h2 style="color: #FF1564;">${creatorName} has a stream scheduled</h2>
        <h3 style="color: #F0F0FF;">${streamTitle}</h3>
        <p style="color: #5A5A7A;">Scheduled for: ${new Date(scheduledAt).toLocaleString()}</p>
        <a href="${process.env.NEXTAUTH_URL}/browse" style="display: inline-block; background: #FF1564; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 16px;">Watch Live</a>
      </div>
    `,
  });
}

export async function sendPaymentReceiptEmail(
  email: string,
  displayName: string,
  amount: string,
  type: string,
  recipientName: string,
) {
  return getResend().emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: `Payment Receipt — ${amount} ${type}`,
    html: `
      <div style="font-family: 'Outfit', sans-serif; background: #03030A; color: #F0F0FF; padding: 40px; border-radius: 16px;">
        <h2 style="color: #FFB800;">Payment Confirmed ✓</h2>
        <p>Hey ${displayName},</p>
        <p>Your ${type} of <strong style="color: #FFB800;">${amount}</strong> to <strong>${recipientName}</strong> has been processed.</p>
        <p style="color: #5A5A7A; font-size: 12px; margin-top: 24px;">This is an automated receipt from CYLive. If you did not authorize this transaction, please contact support immediately.</p>
      </div>
    `,
  });
}

export default resend;
