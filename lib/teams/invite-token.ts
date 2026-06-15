import { randomBytes } from "crypto"

/** A high-entropy, URL-safe, single-use invite token (43 chars from 32 bytes). */
export function buildInviteToken(): string {
  return randomBytes(32).toString("base64url")
}
