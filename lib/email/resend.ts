import { Resend } from "resend"
import { inviteEmailHtml, accessDecisionHtml } from "./invite-template"

const FROM = "YLS <team@yellowlettershop.com>"
function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3010"
}
function client(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

export async function sendInviteEmail(o: { email: string; mode: "invited" | "added"; token?: string }) {
  const c = client()
  if (!c) {
    console.warn("[email] RESEND_API_KEY unset; skipping invite email")
    return
  }
  await c.emails.send({
    from: FROM,
    to: o.email,
    subject: "You're invited to a YLS team",
    html: inviteEmailHtml({ ...o, appUrl: appUrl() }),
  })
}

export async function sendAccessDecisionEmail(o: { email: string; approved: boolean; resource: string }) {
  const c = client()
  if (!c) {
    console.warn("[email] RESEND_API_KEY unset; skipping decision email")
    return
  }
  await c.emails.send({
    from: FROM,
    to: o.email,
    subject: `Access ${o.approved ? "approved" : "denied"}`,
    html: accessDecisionHtml(o),
  })
}
