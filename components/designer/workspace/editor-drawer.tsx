"use client"

import type { ReactNode } from "react"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export function EditorDrawer({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild><Button variant="outline" size="sm">{title}</Button></SheetTrigger>
      <SheetContent side="right" className="w-[min(100vw,24rem)] overflow-y-auto">
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription className="mb-4">Choose the side of your mail piece to edit.</SheetDescription>
        {children}
      </SheetContent>
    </Sheet>
  )
}
