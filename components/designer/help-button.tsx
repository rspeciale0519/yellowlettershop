import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"

export function HelpButton() {
  return (
    <div className="absolute bottom-4 right-4">
      <Button variant="secondary" className="rounded-full shadow-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900">
        <HelpCircle className="h-5 w-5 mr-2" />
        Need design help?
      </Button>
    </div>
  )
}
