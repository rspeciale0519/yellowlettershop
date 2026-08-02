// Transactional email templates — pure functions, no I/O.

export interface EmailContent {
  subject: string
  html: string
  text: string
}

/**
 * Escape user-supplied values before they land in HTML. Team names, roles,
 * etc. are operator/user input; without this they could inject markup or
 * phishing links into an email sent from our trusted domain.
 */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Only allow http(s) URLs into an href. Anything else (javascript:, data:,
 * malformed) collapses to '#'. The result is still HTML-escaped by the caller.
 */
export function safeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url
  } catch {
    /* fall through */
  }
  return '#'
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f7f4;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;padding-bottom:20px;">
      <span style="font-size:20px;font-weight:bold;color:#1a1a1a;">Yellow Letter Shop</span>
    </div>
    <div style="background:#ffffff;border:1px solid #eee8d8;border-radius:8px;padding:28px;">
      <h1 style="margin:0 0 16px;font-size:22px;color:#1a1a1a;">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="text-align:center;color:#999;font-size:12px;margin-top:20px;">
      Yellow Letter Shop · support@yellowlettershop.com
    </p>
  </div>
</body></html>`
}

function button(href: string, label: string): string {
  return `<a href="${esc(safeUrl(href))}" style="display:inline-block;background:#f59e0b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;margin:16px 0;">${esc(label)}</a>`
}

export function orderConfirmationEmail(p: {
  orderId: string
  shortId: string
  total: number
  recordCount: number
  appUrl: string
}): EmailContent {
  const orderUrl = `${p.appUrl}/orders/${p.orderId}`
  return {
    subject: `Order #${p.shortId} received — your letters are in motion`,
    html: layout(
      'Your order is in',
      `<p>We've received order <strong>#${p.shortId}</strong> for <strong>${p.recordCount.toLocaleString()}</strong> mail pieces.</p>
       <p>Total authorized: <strong>$${p.total.toFixed(2)}</strong> — your card will not be charged until you approve the proof.</p>
       <p>We're preparing your print-accurate proof now and will email you the moment it's ready.</p>
       ${button(orderUrl, 'Track your order')}`
    ),
    text: `Order #${p.shortId} received for ${p.recordCount} mail pieces. Total authorized: $${p.total.toFixed(2)}. Your card is not charged until you approve the proof. Track it: ${orderUrl}`,
  }
}

export function proofReadyEmail(p: { orderId: string; shortId: string; appUrl: string }): EmailContent {
  const orderUrl = `${p.appUrl}/orders/${p.orderId}`
  return {
    subject: `Your proof for order #${p.shortId} is ready to review`,
    html: layout(
      'Your proof is ready',
      `<p>The print-accurate proof for order <strong>#${p.shortId}</strong> is ready.</p>
       <p>Nothing prints — and your card isn't charged — until you approve it.</p>
       ${button(orderUrl, 'Review your proof')}`
    ),
    text: `Your proof for order #${p.shortId} is ready. Review and approve it: ${orderUrl}`,
  }
}

export function paymentCapturedEmail(p: {
  orderId: string
  shortId: string
  total: number
  appUrl: string
}): EmailContent {
  const orderUrl = `${p.appUrl}/orders/${p.orderId}`
  return {
    subject: `Payment received — order #${p.shortId} is moving to production`,
    html: layout(
      'Payment received',
      `<p>You approved the proof for order <strong>#${p.shortId}</strong>, and we've captured your payment of <strong>$${p.total.toFixed(2)}</strong>.</p>
       <p>Your mail pieces are headed to production. We'll keep your order page updated at every step.</p>
       ${button(orderUrl, 'View order status')}`
    ),
    text: `Payment of $${p.total.toFixed(2)} captured for order #${p.shortId}. It's moving to production. Status: ${orderUrl}`,
  }
}

/** Human labels for the enum-ish values stored on orders. */
function prettyLabel(value: string | null): string {
  if (!value) return 'Not specified'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Sent to the print vendor when an order is handed off. Carries the two signed
 * artifacts (approved proof + recipient CSV) plus the specs needed to run it.
 * Vendor-supplied values are escaped — this goes out from our trusted domain.
 */
export function vendorDispatchEmail(p: {
  shortId: string
  vendorName: string
  recordCount: number
  mailClass: string | null
  postageType: string | null
  proofUrl: string
  csvUrl: string
}): EmailContent {
  const vendor = esc(p.vendorName)
  return {
    subject: `New print job — order #${p.shortId} (${p.recordCount.toLocaleString()} pieces)`,
    html: layout(
      `New print job: #${p.shortId}`,
      `<p>Hi ${vendor},</p>
       <p>A new mail job is ready for production.</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
         <tr><td style="padding:6px 0;color:#666;">Order</td><td style="padding:6px 0;"><strong>#${esc(p.shortId)}</strong></td></tr>
         <tr><td style="padding:6px 0;color:#666;">Quantity</td><td style="padding:6px 0;"><strong>${p.recordCount.toLocaleString()}</strong> pieces</td></tr>
         <tr><td style="padding:6px 0;color:#666;">Mail class</td><td style="padding:6px 0;">${esc(prettyLabel(p.mailClass))}</td></tr>
         <tr><td style="padding:6px 0;color:#666;">Postage</td><td style="padding:6px 0;">${esc(prettyLabel(p.postageType))}</td></tr>
       </table>
       <p>The customer has approved this proof and payment is captured.</p>
       ${button(p.proofUrl, 'Download approved proof')}
       <br>
       ${button(p.csvUrl, 'Download recipient list')}
       <p style="color:#666;font-size:13px;">These links expire in 7 days. Reply to this email with tracking once the job ships.</p>`
    ),
    text: `New print job — order #${p.shortId}: ${p.recordCount} pieces, ${prettyLabel(p.mailClass)}, ${prettyLabel(p.postageType)}. Approved proof: ${safeUrl(p.proofUrl)} Recipient list: ${safeUrl(p.csvUrl)} (links expire in 7 days).`,
  }
}

/** Sent to the customer when the vendor reports the job as shipped/mailed. */
export function orderShippedEmail(p: {
  orderId: string
  shortId: string
  trackingNumber?: string | null
  trackingCarrier?: string | null
  appUrl: string
}): EmailContent {
  const orderUrl = `${p.appUrl}/orders/${p.orderId}`
  const hasTracking = !!p.trackingNumber
  const trackingHtml = hasTracking
    ? `<p>Tracking${p.trackingCarrier ? ` (${esc(p.trackingCarrier)})` : ''}: <strong>${esc(p.trackingNumber as string)}</strong></p>`
    : ''
  const trackingText = hasTracking
    ? ` Tracking${p.trackingCarrier ? ` (${p.trackingCarrier})` : ''}: ${p.trackingNumber}.`
    : ''

  return {
    subject: `Order #${p.shortId} is in the mail`,
    html: layout(
      'Your mail is on its way',
      `<p>Order <strong>#${esc(p.shortId)}</strong> has been printed and handed to the postal service.</p>
       ${trackingHtml}
       <p>Delivery typically takes several business days depending on your mail class.</p>
       ${button(orderUrl, 'View order status')}`
    ),
    text: `Order #${p.shortId} has shipped.${trackingText} Status: ${orderUrl}`,
  }
}

export function teamInviteEmail(p: { teamName: string; inviteUrl: string; role: string }): EmailContent {
  // teamName and role are user-supplied → escape in HTML to prevent injecting
  // markup/phishing links into an email sent from our trusted domain.
  const team = esc(p.teamName)
  const role = esc(p.role)
  return {
    subject: `You've been invited to join ${p.teamName} on Yellow Letter Shop`,
    html: layout(
      `Join ${team}`,
      `<p>You've been invited to join <strong>${team}</strong> as a <strong>${role}</strong> on Yellow Letter Shop.</p>
       ${button(p.inviteUrl, 'Accept invitation')}
       <p style="color:#666;font-size:13px;">This invitation expires in 7 days.</p>`
    ),
    text: `You've been invited to join ${p.teamName} as a ${p.role} on Yellow Letter Shop. Accept: ${safeUrl(p.inviteUrl)}`,
  }
}
