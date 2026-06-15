import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TeamEmptyState({ onInvite }: { onInvite: () => void }) {
  return (
    <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <Users className="h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">No team yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Invite a teammate to start collaborating. Your team is created automatically when you send
        the first invite.
      </p>
      <Button className="mt-4" onClick={onInvite}>
        <Users className="mr-2 h-4 w-4" />
        Invite your first teammate
      </Button>
    </div>
  )
}
