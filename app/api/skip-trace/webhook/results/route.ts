import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

// Ensure Node runtime to access Node crypto
export const runtime = "nodejs";

// Optional: make route always dynamic (webhooks should not be cached)
export const dynamic = "force-dynamic";

// Canonical UUID v1-5 regex (case-insensitive)
const UUID_CANONICAL_REGEX = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;

// Subject pattern: e.g., "Order <uuid> ..."
// First capture a 36-char UUID-like token, then validate with canonical regex
const ORDER_SUBJECT_CAPTURE = /Order\s+([0-9a-f-]{36})/i;

function timingSafeEqualHex(aHex: string, bHex: string): boolean {
  try {
    const a = Buffer.from(aHex, "hex");
    const b = Buffer.from(bHex, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function verifyMailgunSignature(apiKey: string, timestamp?: string, token?: string, signature?: string): boolean {
  if (!apiKey || !timestamp || !token || !signature) return false;
  const hmac = crypto.createHmac("sha256", apiKey);
  hmac.update(timestamp);
  hmac.update(token);
  const digestHex = hmac.digest("hex");
  return timingSafeEqualHex(digestHex, signature);
}

function extractOrderIdFromSubject(subject?: string): string | null {
  if (!subject) return null;
  const match = subject.match(ORDER_SUBJECT_CAPTURE);
  if (!match || !match[1]) return null;
  const candidate = match[1];
  return UUID_CANONICAL_REGEX.test(candidate) ? candidate.toLowerCase() : null;
}

function normalizeEmail(value?: string): string | null {
  if (!value) return null;
  return value.trim().toLowerCase();
}

// Optional: environment-provided sender fragment to check (not required)
const EXPECTED_SENDER_FRAGMENT = (process.env.MAILGUN_EXPECTED_SENDER || "").trim().toLowerCase();

export async function POST(req: NextRequest) {
  // Mailgun posts multipart/form-data. Next.js App Router supports req.formData().
  const form = await req.formData();

  const timestamp = form.get("timestamp")?.toString();
  const token = form.get("token")?.toString();
  const signature = form.get("signature")?.toString();

  const apiKey = process.env.MAILGUN_API_KEY;
  if (!apiKey) {
    console.error("MAILGUN_API_KEY is not set. Rejecting webhook.");
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const isValid = verifyMailgunSignature(apiKey, timestamp, token, signature);
  if (!isValid) {
    console.warn("Mailgun signature verification failed", { timestamp, token });
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const subject = form.get("subject")?.toString();
  const from = normalizeEmail(form.get("from")?.toString() || form.get("sender")?.toString());

  // Extract order UUID from subject
  const orderId = extractOrderIdFromSubject(subject);
  if (!orderId) {
    console.warn("Unable to extract orderId from subject", { subject });
    return NextResponse.json({ error: "Missing or invalid order id in subject" }, { status: 400 });
  }

  // Optional sender check: if EXPECTED_SENDER_FRAGMENT provided, ensure "from" contains it
  if (EXPECTED_SENDER_FRAGMENT && from && !from.includes(EXPECTED_SENDER_FRAGMENT)) {
    console.warn(`Unexpected sender '${from}' for order ${orderId}. Expected to include '${EXPECTED_SENDER_FRAGMENT}'.`);
    // Continue processing, only warn.
  }

  // TODO: Process attachments/CSV if needed.
  // Example: const attachment = form.get("attachment-1"); // may be a File
  // Parse file, update order status, etc.

  // For now, acknowledge receipt with the parsed orderId
  return NextResponse.json({ ok: true, orderId });
}
