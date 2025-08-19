"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

export interface DraggableSliderProps {
  label: string
  value: number[]
  min: number
  max: number
  step: number
  formatValue: (value: number) => string
  onChange: (value: number[]) => void
  ariaLabel: string
  icon?: React.ReactNode
  tooltip?: string
}

export function DraggableSlider({
  label,
  value,
  min,
  max,
  step,
  formatValue,
  onChange,
  ariaLabel,
  icon,
  tooltip,
}: DraggableSliderProps) {
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  const getSliderBounds = useCallback(() => {
    if (!sliderRef.current) return { left: 0, width: 0 }
    const rect = sliderRef.current.getBoundingClientRect()
    return { left: rect.left, width: rect.width }
  }, [])

  const valueToPosition = useCallback(
    (val: number) => {
      return ((val - min) / (max - min)) * 100
    },
    [min, max],
  )

  const positionToValue = useCallback(
    (position: number, bounds: { left: number; width: number }) => {
      const percentage = Math.max(0, Math.min(100, (position / bounds.width) * 100))
      const rawValue = min + (percentage / 100) * (max - min)
      return Math.round(rawValue / step) * step
    },
    [min, max, step],
  )

  const handleMouseDown = useCallback(
    (handle: "min" | "max") => (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(handle)
      document.body.style.userSelect = "none"
    },
    [],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return

      const bounds = getSliderBounds()
      const clientX = e.clientX - bounds.left
      const newValue = positionToValue(clientX, bounds)

      if (isDragging === "min") {
        const newMin = Math.max(min, Math.min(newValue, value[1] - step))
        onChange([newMin, value[1]])
      } else {
        const newMax = Math.min(max, Math.max(newValue, value[0] + step))
        onChange([value[0], newMax])
      }
    },
    [isDragging, value, onChange, getSliderBounds, positionToValue, min, max, step],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
    document.body.style.userSelect = ""
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <Label className="font-medium">{label}</Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div
        ref={sliderRef}
        className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value[1]}
        aria-valuetext={`${formatValue(value[0])} to ${formatValue(value[1])}`}
        tabIndex={-1}
      >
        <div
          className="absolute h-full bg-yellow-500 rounded-full transition-all duration-150"
          style={{
            left: `${valueToPosition(value[0])}%`,
            width: `${valueToPosition(value[1]) - valueToPosition(value[0])}%`,
          }}
        />

        <div
          className={`absolute top-1/2 w-6 h-6 bg-white border-2 border-yellow-500 rounded-full shadow-md cursor-grab transform -translate-y-1/2 -translate-x-1/2 transition-all duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
            isDragging === "min" ? "cursor-grabbing scale-110 ring-2 ring-yellow-500 ring-offset-2" : ""
          }`}
          style={{ left: `${valueToPosition(value[0])}%` }}
          onMouseDown={handleMouseDown("min")}
          role="slider"
          aria-label={`${label} minimum value`}
          aria-valuemin={min}
          aria-valuemax={value[1] - step}
          aria-valuenow={value[0]}
          aria-valuetext={formatValue(value[0])}
          tabIndex={0}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          </div>
        </div>

        <div
          className={`absolute top-1/2 w-6 h-6 bg-white border-2 border-yellow-500 rounded-full shadow-md cursor-grab transform -translate-y-1/2 -translate-x-1/2 transition-all duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
            isDragging === "max" ? "cursor-grabbing scale-110 ring-2 ring-yellow-500 ring-offset-2" : ""
          }`}
          style={{ left: `${valueToPosition(value[1])}%` }}
          onMouseDown={handleMouseDown("max")}
          role="slider"
          aria-label={`${label} maximum value`}
          aria-valuemin={value[0] + step}
          aria-valuemax={max}
          aria-valuenow={value[1]}
          aria-valuetext={formatValue(value[1])}
          tabIndex={0}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          </div>
        </div>
      </div>

      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium">{formatValue(value[0])}</span>
        <span className="font-medium">{formatValue(value[1])}</span>
      </div>
    </div>
  )
}
