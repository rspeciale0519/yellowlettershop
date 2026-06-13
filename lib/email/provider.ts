// Pure email-provider resolution — separated from the sender so it is unit
// testable without env mutation or network.

export type EmailProvider = 'resend' | 'mailgun'

export interface EmailConfig {
  provider: EmailProvider
  apiKey: string
  /** Mailgun only */
  domain?: string
  from: string
}

const DEFAULT_FROM = 'Yellow Letter Shop <no-reply@yellowlettershop.com>'

type EnvLike = Record<string, string | undefined>

/**
 * Resolve the configured provider from env vars. Resend wins when both are
 * present (single env var, simpler ops). Returns null when unconfigured —
 * callers must treat that as a loud failure, never a silent skip.
 */
export function resolveEmailConfig(env: EnvLike): EmailConfig | null {
  const from = env.EMAIL_FROM || DEFAULT_FROM

  if (env.RESEND_API_KEY) {
    return { provider: 'resend', apiKey: env.RESEND_API_KEY, from }
  }
  if (env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN) {
    return {
      provider: 'mailgun',
      apiKey: env.MAILGUN_API_KEY,
      domain: env.MAILGUN_DOMAIN,
      from,
    }
  }
  return null
}
