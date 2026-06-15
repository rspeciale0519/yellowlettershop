"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Trash } from "lucide-react"
import { InviteDialog } from "./invite-dialog"

export interface TeamMemberRow {
  user_id: string
  role: "owner" | "admin" | "member"
  status: string
}
export interface InvitationRow {
  id: string
  email: string
  role: string
  status: string
}

export function MembersTab({
  members,
  invitations,
  role,
  maxSeats,
  onChanged,
}: {
  members: TeamMemberRow[]
  invitations: InvitationRow[]
  role: "owner" | "admin" | "member"
  maxSeats: number | null
  onChanged: () => void
}) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const canManage = role !== "member"
  const seatsUsed = members.length + invitations.length

  const changeRole = async (userId: string, newRole: "admin" | "member") => {
    await fetch(`/api/teams/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    })
    onChanged()
  }
  const removeMember = async (userId: string) => {
    await fetch(`/api/teams/members/${userId}`, { method: "DELETE" })
    onChanged()
  }
  const revokeInvite = async (id: string) => {
    await fetch(`/api/teams/invitations/${id}`, { method: "DELETE" })
    onChanged()
  }
  const resendInvite = async (id: string) => {
    await fetch(`/api/teams/invitations/${id}`, { method: "POST" })
    onChanged()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Members</h2>
          <p className="text-muted-foreground">
            {seatsUsed}
            {maxSeats ? ` / ${maxSeats}` : ""} seats used
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite teammate
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team roster</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 rounded border p-2">
              <span className="font-mono text-xs text-muted-foreground">{m.user_id.slice(0, 8)}</span>
              <Badge variant={m.role === "owner" ? "default" : "secondary"}>{m.role}</Badge>
              <div className="ml-auto flex items-center gap-2">
                {canManage && m.role !== "owner" && (
                  <>
                    <Select value={m.role} onValueChange={(v) => changeRole(m.user_id, v as "admin" | "member")}>
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => removeMember(m.user_id)}>
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {canManage && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 rounded border p-2">
                <span className="text-sm">{inv.email}</span>
                <Badge variant="secondary">{inv.role}</Badge>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => resendInvite(inv.id)}>
                    Resend
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => revokeInvite(inv.id)}>
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} onInvited={onChanged} />
    </div>
  )
}
