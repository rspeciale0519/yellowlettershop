"use client"

import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpDialogBody } from "@/components/designer/help-dialog"

// Icon-only + bottom-right so it never collides with the centered canvas
// zoom toolbar. Now actually opens an accessible Help dialog (was a dead CTA).
export function HelpButton() {
  return (
    <div className="absolute bottom-4 right-4 z-40">
      <Dialog>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  variant="brand"
                  size="icon"
                  className="rounded-full shadow-lg"
                  aria-label="Open designer help"
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Help &amp; shortcuts</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DialogContent className="max-w-md">
          <HelpDialogBody />
        </DialogContent>
      </Dialog>
    </div>
  )
}
