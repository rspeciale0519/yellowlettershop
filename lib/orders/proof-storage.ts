import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Proof PDFs contain recipient PII (names/addresses merged onto the mail piece),
 * so they live in a PRIVATE bucket and are served only via short-lived signed
 * URLs. Provisioning is a migration concern (20260613060000) — request handlers
 * never create the bucket, so a misconfigured deploy fails loudly instead of
 * silently re-creating storage as public.
 */
export const PROOF_BUCKET = 'design-previews'

const DEFAULT_TTL_SECONDS = 60 * 30 // 30 minutes

/**
 * Resolve a stored proof reference into a viewable URL.
 * - New rows store a storage PATH → mint a short-lived signed URL.
 * - Legacy rows may hold a full public URL → pass through unchanged (the
 *   private-bucket migration rewrites these to paths, but be defensive).
 */
export async function signProofUrl(
  supabase: SupabaseClient,
  stored: string | null,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<string | null> {
  if (!stored) return null
  if (/^https?:\/\//i.test(stored)) return stored
  const { data, error } = await supabase.storage
    .from(PROOF_BUCKET)
    .createSignedUrl(stored, ttlSeconds)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
