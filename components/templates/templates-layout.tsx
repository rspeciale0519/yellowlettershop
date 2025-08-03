import type React from "react"

interface TemplatesLayoutProps {
  sidebar: React.ReactNode
  main: React.ReactNode
}

export function TemplatesLayout({ sidebar, main }: TemplatesLayoutProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">{sidebar}</div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">{main}</div>
    </div>
  )
}
