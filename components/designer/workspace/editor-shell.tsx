"use client"

import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { EditorDrawer } from "./editor-drawer"

export interface EditorShellProps {
  header: ReactNode
  content: ReactNode
  canvas: ReactNode
  pages: ReactNode
  /** Future selected text-box editor; existing tools remain the fallback. */
  writing?: ReactNode
}

export function EditorShell({ header, content, canvas, pages, writing }: EditorShellProps) {
  const [task, setTask] = useState<"content" | "canvas">("canvas")
  const [showPages, setShowPages] = useState(false)
  return (
    <div className="flex h-[100dvh] min-h-0 min-w-0 flex-col overflow-hidden bg-background text-foreground">
      {header}
      <nav aria-label="Editor workspace" className="flex shrink-0 items-center gap-2 border-b bg-card px-3 py-2">
        <div className="flex gap-1 lg:hidden">
          <Button size="sm" variant={task === "content" ? "secondary" : "ghost"} aria-pressed={task === "content"} onClick={() => setTask("content")}>Edit content</Button>
          <Button size="sm" variant={task === "canvas" ? "secondary" : "ghost"} aria-pressed={task === "canvas"} onClick={() => setTask("canvas")}>Canvas</Button>
        </div>
        <span className="hidden text-sm text-muted-foreground lg:inline">Design workspace</span>
        <div className="ml-auto lg:hidden"><EditorDrawer title="Pages">{pages}</EditorDrawer></div>
        <Button size="sm" variant="ghost" className="ml-auto hidden lg:inline-flex" aria-expanded={showPages} onClick={() => setShowPages(!showPages)}>{showPages ? "Hide pages" : "Show pages"}</Button>
      </nav>
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <section aria-label="Content tools" className={`${task === "content" ? "flex" : "hidden"} min-h-0 min-w-0 w-full shrink-0 flex-col overflow-hidden lg:flex lg:w-[360px]`}>
          {writing ?? content}
        </section>
        <section aria-label="Design canvas" className={`${task === "canvas" ? "block" : "hidden"} relative min-h-0 min-w-0 flex-1 lg:block`}>
          {canvas}
        </section>
        {showPages && <section aria-label="Page navigation" className="hidden w-44 shrink-0 overflow-y-auto border-l bg-card p-3 lg:block">{pages}</section>}
      </div>
    </div>
  )
}
