"use client"

import { getFontFamily, type DesignerFont } from "@/components/designer/designer-fonts"
import { QrRenderer } from "@/components/designer/qr-renderer"
import { POSTAGE_DEFAULTS } from "@/components/designer/postage"
import type { DesignElement } from "@/types/designer"

// Moved verbatim from canvas-area (Phase 2 — behavior-preserving split).
// Render plumbing for new fields (fit/rotation/etc.) is added in Phase 3.
export function RenderElement({
  element,
  fonts,
  editing,
  onEdit,
  onUpdate,
}: {
  element: DesignElement
  fonts: DesignerFont[]
  editing: boolean
  onEdit: () => void
  onUpdate: (updates: Partial<DesignElement>) => void
}) {
  if (element.type === "text") {
    const justifyContent = element.textAlign === "right" ? "flex-end" : element.textAlign === "center" ? "center" : "flex-start"
    return (
      <div
        contentEditable={editing && !element.locked}
        suppressContentEditableWarning
        onDoubleClick={onEdit}
        onBlur={(event) => onUpdate({ content: event.currentTarget.textContent || "" })}
        style={{
          fontSize: element.fontSize,
          fontWeight: element.fontWeight,
          fontStyle: element.fontStyle ?? "normal",
          textDecoration: element.textDecoration ?? "none",
          lineHeight: element.lineHeight ?? 1.2,
          letterSpacing: element.letterSpacing != null ? `${element.letterSpacing}px` : undefined,
          fontFamily: getFontFamily(element.fontFamily, fonts),
          color: element.color ?? "#111827",
          textAlign: element.textAlign ?? "left",
          justifyContent,
        }}
        className="flex h-full w-full items-center p-1 outline-none"
      >
        {element.content}
      </div>
    )
  }

  if (element.type === "image") {
    if (element.src.startsWith("placeholder:")) {
      return (
        <div className="flex h-full w-full items-center justify-center rounded border border-gray-300 bg-gray-100 px-3 text-center text-sm font-semibold uppercase tracking-wide text-gray-500">
          {element.src.replace("placeholder:", "")}
        </div>
      )
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={element.src}
        alt={element.name}
        className={`h-full w-full ${element.fit === "cover" ? "object-cover" : "object-contain"}`}
      />
    )
  }

  if (element.type === "graphic") {
    const radius =
      element.borderRadius != null
        ? `${element.borderRadius}px`
        : element.shape === "circle"
          ? "9999px"
          : element.shape === "badge"
            ? "12px"
            : "0"
    const height = element.shape === "line" ? Math.max(2, element.strokeWidth ?? 4) : "100%"
    return (
      <div
        className="h-full w-full"
        style={{
          background: element.shape === "line" ? element.stroke ?? element.fill : element.fill,
          border: element.strokeWidth ? `${element.strokeWidth}px solid ${element.stroke ?? element.fill}` : undefined,
          borderRadius: radius,
          height,
        }}
      />
    )
  }

  if (element.type === "qr") {
    return (
      <QrRenderer value={element.value} foreground={element.foreground} background={element.background} alt={element.name} />
    )
  }

  if (element.type === "postage") {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-sm border-2 border-dashed border-amber-500/70 bg-amber-500/10 text-center text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
        {POSTAGE_DEFAULTS[element.kind].label}
      </div>
    )
  }

  return (
    <table className="h-full w-full border-collapse text-sm text-gray-950">
      <tbody>
        {element.cells.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, columnIndex) => (
              <td
                key={`${rowIndex}-${columnIndex}`}
                contentEditable={editing && !element.locked}
                suppressContentEditableWarning
                className={`border border-gray-400 px-2 py-1 outline-none ${
                  element.headerRow && rowIndex === 0 ? "bg-gray-100 font-semibold" : ""
                }`}
                onBlur={(event) => {
                  const cells = element.cells.map((item) => [...item])
                  cells[rowIndex][columnIndex] = event.currentTarget.textContent || ""
                  onUpdate({ cells })
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
