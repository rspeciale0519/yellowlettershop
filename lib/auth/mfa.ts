import type { Factor, SupabaseClient } from '@supabase/supabase-js'

/**
 * Client-safe helpers wrapping Supabase TOTP multi-factor auth.
 * Each helper throws a plain Error on failure so callers can surface the
 * message via toast / inline UI without inspecting Supabase's union types.
 */

export type { Factor }

export interface TotpEnrollment {
  factorId: string
  qrCode: string
  secret: string
}

/** Start a new TOTP enrollment. Returns the QR code (SVG data URI) + secret. */
export async function enrollTotp(supabase: SupabaseClient): Promise<TotpEnrollment> {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
  if (error) throw error
  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  }
}

/** Challenge + verify an enrolled factor with the user's 6-digit code. */
export async function verifyTotp(
  supabase: SupabaseClient,
  factorId: string,
  code: string,
): Promise<void> {
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
  if (challengeError) throw challengeError

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  })
  if (verifyError) throw verifyError
}

/** Remove an enrolled factor (verified or pending). */
export async function unenrollTotp(supabase: SupabaseClient, factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) throw error
}

/** Return the user's verified TOTP factor, or null when none is active. */
export async function getVerifiedTotpFactor(supabase: SupabaseClient): Promise<Factor | null> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error
  return data.totp.find((factor) => factor.status === 'verified') ?? null
}
