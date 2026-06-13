// Transactional email templates — pure functions, no I/O.

export interface EmailContent {
  subject: string
  html: string
  text: string
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
  return `<a href="${href}" style="display:inline-block;background:#f59e0b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;margin:16px 0;">${label}</a>`
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

export function teamInviteEmail(p: { teamName: string; inviteUrl: string; role: string }): EmailContent {
  return {
    subject: `You've been invited to join ${p.teamName} on Yellow Letter Shop`,
    html: layout(
      `Join ${p.teamName}`,
      `<p>You've been invited to join <strong>${p.teamName}</strong> as a <strong>${p.role}</strong> on Yellow Letter Shop.</p>
       ${button(p.inviteUrl, 'Accept invitation')}
       <p style="color:#666;font-size:13px;">This invitation expires in 7 days.</p>`
    ),
    text: `You've been invited to join ${p.teamName} as a ${p.role} on Yellow Letter Shop. Accept: ${p.inviteUrl}`,
  }
}
