"use client"

import { HexColorInput, HexColorPicker } from "react-colorful"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  BRAND_SWATCHES,
  labelClass,
} from "@/components/designer/inspector/inspector-styles"
import { useRecentColors } from "@/components/designer/inspector/use-recent-colors"

export interface ColorFieldProps {
  value?: string
  onChange: (value: string | undefined) => void
  label?: string
  id?: string
  allowClear?: boolean
}

function Swatches({
  colors,
  onPick,
}: {
  colors: string[]
  onPick: (color: string) => void
}) {
  if (colors.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Use ${color}`}
          className="h-6 w-6 rounded border border-slate-600"
          style={{ backgroundColor: color }}
          onClick={() => onPick(color)}
        />
      ))}
    </div>
  )
}

export function ColorField({ value, onChange, label, id, allowClear }: ColorFieldProps) {
  const { recent, addRecentColor } = useRecentColors()
  const current = value ?? "#000000"

  return (
    <div className="space-y-1">
      {label ? <Label className={labelClass}>{label}</Label> : null}
      <Popover
        onOpenChange={(open) => {
          if (!open && value) addRecentColor(value)
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            aria-label={`${label ?? "Color"} ${value ?? "none"}`}
            className="flex h-10 w-full items-center gap-2 rounded-md border border-slate-700 bg-slate-950/70 px-2 text-sm text-white"
          >
            <span
              className="h-6 w-6 shrink-0 rounded border border-slate-600"
              style={{ backgroundColor: value ?? "transparent" }}
            />
            <span className="font-mono text-xs text-slate-300">{value ?? "None"}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-60 space-y-3 border-slate-700 bg-slate-900 p-3">
          <HexColorPicker color={current} onChange={onChange} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">#</span>
            <HexColorInput
              color={current}
              onChange={onChange}
              prefixed={false}
              className="h-8 w-full rounded border border-slate-700 bg-slate-950/70 px-2 font-mono text-xs text-white outline-none focus:border-yellow-400"
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Brand</p>
            <Swatches colors={BRAND_SWATCHES} onPick={onChange} />
          </div>
          {recent.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Recent</p>
              <Swatches colors={recent} onPick={onChange} />
            </div>
          )}
          {allowClear && (
            <button
              type="button"
              className="w-full rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-yellow-400 hover:text-yellow-200"
              onClick={() => onChange(undefined)}
            >
              Clear
            </button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
