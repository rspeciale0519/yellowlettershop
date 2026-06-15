/** Pure HTML builders for team emails (no SDK import — unit-testable). */
export function inviteEmailHtml(o: { mode: "invited" | "added"; token?: string; appUrl: string }): string {
  if (o.mode === "invited") {
    const link = `${o.appUrl}/signup?invite=${o.token}`
    return `<p>You've been invited to a Yellow Letter Shop team.</p><p><a href="${link}">Accept your invitation</a></p>`
  }
  return `<p>You've been added to a Yellow Letter Shop team. <a href="${o.appUrl}/dashboard/team-management">Open your team</a>.</p>`
}

export function accessDecisionHtml(o: { approved: boolean; resource: string }): string {
  return `<p>Your request for ${o.resource} was ${o.approved ? "approved" : "denied"}.</p>`
}
