/**
 * Email service abstraction.
 *
 * Provider is selected by EMAIL_PROVIDER env var:
 *   console  — logs to stdout only (default for development/test)
 *   resend   — uses Resend API (https://resend.com)
 *   sendgrid — uses SendGrid API
 *
 * Required env vars:
 *   EMAIL_PROVIDER   "resend" | "sendgrid" | "console"
 *   EMAIL_API_KEY    API key for Resend or SendGrid
 *   EMAIL_FROM       Sender address, e.g. noreply@vaultlore.app
 */

import { env } from "../config/env";

export type EmailMessage = {
  to: string;
  subject: string;
  textBody: string;
  htmlBody: string;
};

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

// ---------------------------------------------------------------------------
// Console provider (dev / test)
// ---------------------------------------------------------------------------

class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.log("[email:console] ──────────────────────────────────");
    console.log(`  To:      ${message.to}`);
    console.log(`  From:    ${env.EMAIL_FROM}`);
    console.log(`  Subject: ${message.subject}`);
    console.log("  Body:");
    console.log(message.textBody);
    console.log("[email:console] ──────────────────────────────────");
  }
}

// ---------------------------------------------------------------------------
// Resend provider
// ---------------------------------------------------------------------------

class ResendEmailProvider implements EmailProvider {
  private readonly apiKey: string;

  constructor() {
    if (!env.EMAIL_API_KEY) {
      throw new Error("EMAIL_API_KEY is required when EMAIL_PROVIDER=resend");
    }
    this.apiKey = env.EMAIL_API_KEY;
  }

  async send(message: EmailMessage): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [message.to],
        subject: message.subject,
        text: message.textBody,
        html: message.htmlBody
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend delivery failed: ${response.status} ${body}`);
    }
  }
}

// ---------------------------------------------------------------------------
// SendGrid provider
// ---------------------------------------------------------------------------

class SendGridEmailProvider implements EmailProvider {
  private readonly apiKey: string;

  constructor() {
    if (!env.EMAIL_API_KEY) {
      throw new Error("EMAIL_API_KEY is required when EMAIL_PROVIDER=sendgrid");
    }
    this.apiKey = env.EMAIL_API_KEY;
  }

  async send(message: EmailMessage): Promise<void> {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: message.to }] }],
        from: { email: env.EMAIL_FROM },
        subject: message.subject,
        content: [
          { type: "text/plain", value: message.textBody },
          { type: "text/html", value: message.htmlBody }
        ]
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SendGrid delivery failed: ${response.status} ${body}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Factory — driven by env
// ---------------------------------------------------------------------------

function createEmailProvider(): EmailProvider {
  switch (env.EMAIL_PROVIDER) {
    case "resend":
      return new ResendEmailProvider();
    case "sendgrid":
      return new SendGridEmailProvider();
    case "console":
    default:
      return new ConsoleEmailProvider();
  }
}

export const emailService: EmailProvider = createEmailProvider();

// ---------------------------------------------------------------------------
// Template helpers
// ---------------------------------------------------------------------------

export function passwordResetEmail(resetUrl: string): Pick<EmailMessage, "subject" | "textBody" | "htmlBody"> {
  return {
    subject: "Reset your VaultLore password",
    textBody: `You requested a password reset for your VaultLore account.\n\nUse this link to set a new password (expires in 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
    htmlBody: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0d1018;color:#f4f0e8;padding:32px;border-radius:16px">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#d6aa52;font-weight:700;margin-bottom:16px">VaultLore</div>
        <h1 style="font-size:26px;font-weight:800;margin:0 0 12px">Reset your password</h1>
        <p style="color:#a4adba;line-height:1.6;margin:0 0 24px">Use the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#d6aa52;color:#111;font-weight:800;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:15px">Set new password</a>
        <p style="color:#a4adba;font-size:12px;margin-top:24px;line-height:1.6">If the button doesn't work, copy and paste this URL into your browser:<br><span style="color:#d6aa52">${resetUrl}</span></p>
        <p style="color:#6b7280;font-size:11px;margin-top:32px">If you didn't request this reset, you can safely ignore this email — your account remains secure.</p>
      </div>
    `
  };
}
