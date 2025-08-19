"use client"

import * as React from "react"
import { CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import type { DateRange } from "react-day-picker"
import { formatDate, parseISODate, toISODateString } from "@/lib/utils"

export interface DateRangeValue { from: string; to: string }

interface DateRangePickerProps {
  label: string
  value?: { from?: string | null; to?: string | null } | null
  onChange: (value: DateRangeValue | null) => void
  nullable?: boolean
  numberOfMonths?: number
}

export function DateRangePicker({ label, value, onChange, nullable = true, numberOfMonths = 2 }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: value ? parseISODate(value?.from ?? undefined) : undefined,
    to: value ? parseISODate(value?.to ?? undefined) : undefined,
  })

  const handleSelect = (next: DateRange | undefined) => {
    if (!next) {
      setRange(undefined)
      if (nullable) onChange(null)
      return
    }
    // Normalize order
    const from = next.from && next.to && next.from > next.to ? next.to : next.from
    const to = next.from && next.to && next.from > next.to ? next.from : next.to
    const normalized = { from, to }
    setRange(normalized)
    if (normalized.from && normalized.to) {
      onChange({ from: toISODateString(normalized.from), to: toISODateString(normalized.to) })
    }
  }

  const summary = range?.from && range?.to
    ? `${formatDate(range.from)} — ${formatDate(range.to)}`
    : "Pick a date range"

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start w-full">
            <CalendarDays className="mr-2 h-4 w-4" />
            {summary}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={numberOfMonths}
          />
          <div className="flex items-center justify-between border-t p-2">
            <div className="text-xs text-muted-foreground">
              {range?.from && !range?.to ? "Select an end date" : ""}
            </div>
            {nullable && (
              <Button variant="ghost" size="sm" onClick={() => handleSelect(undefined)}>
                Clear
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
