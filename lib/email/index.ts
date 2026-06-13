import 'server-only'
import { resolveEmailConfig, type EmailConfig } from './provider'
import type { EmailContent } from './templates'

export class EmailNotConfiguredError extends Error {
  constructor() {
    super(
      'Outbound email is not configured — set RESEND_API_KEY (preferred) or MAILGUN_API_KEY + MAILGUN_DOMAIN'
    )
    this.name = 'EmailNotConfiguredError'
  }
}

async function sendViaResend(cfg: EmailConfig, to: string, content: EmailContent): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: cfg.from,
      to: [to],
      subject: content.subject,
      html: content.html,
      text: content.text,
    }),
  })
  if (!res.ok) {
    throw new Error(`Resend send failed (${res.status}): ${await res.text()}`)
  }
}

async function sendViaMailgun(cfg: EmailConfig, to: string, content: EmailContent): Promise<void> {
  const form = new URLSearchParams({
    from: cfg.from,
    to,
    subject: content.subject,
    html: content.html,
    text: content.text,
  })
  const res = await fetch(`https://api.mailgun.net/v3/${cfg.domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${cfg.apiKey}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })
  if (!res.ok) {
    throw new Error(`Mailgun send failed (${res.status}): ${await res.text()}`)
  }
}

/**
 * Send a transactional email. Throws EmailNotConfiguredError when no provider
 * is configured — callers on non-critical paths catch and log; the failure is
 * never silent.
 */
export async function sendEmail(to: string, content: EmailContent): Promise<void> {
  const cfg = resolveEmailConfig(process.env)
  if (!cfg) throw new EmailNotConfiguredError()
  if (cfg.provider === 'resend') return sendViaResend(cfg, to, content)
  return sendViaMailgun(cfg, to, content)
}

/**
 * Fire an email on a path where delivery failure must not fail the request
 * (e.g. order confirmation after a successful submit). The failure is logged
 * loudly and reported back as false — never swallowed invisibly.
 */
export async function trySendEmail(to: string | null | undefined, content: EmailContent): Promise<boolean> {
  if (!to) {
    console.error(`Email skipped — no recipient address for "${content.subject}"`)
    return false
  }
  try {
    await sendEmail(to, content)
    return true
  } catch (err) {
    console.error(`Email send failed for "${content.subject}" to ${to}:`, err)
    return false
  }
}
