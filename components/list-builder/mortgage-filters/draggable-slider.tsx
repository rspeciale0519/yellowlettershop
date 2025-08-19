"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"

// Draggable Slider Component (standardized with Property filters)
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
  const minHandleRef = useRef<HTMLDivElement>(null)
  const maxHandleRef = useRef<HTMLDivElement>(null)

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

  const handleTouchStart = useCallback(
    (handle: "min" | "max") => (e: React.TouchEvent) => {
      e.preventDefault()
      setIsDragging(handle)
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

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !sliderRef.current) return

      e.preventDefault()
      const bounds = getSliderBounds()
      const touch = e.touches[0]
      const clientX = touch.clientX - bounds.left
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

  const handleTouchEnd = useCallback(() => {
    setIsDragging(null)
  }, [])

  const handleKeyDown = useCallback(
    (handle: "min" | "max") => (e: React.KeyboardEvent) => {
      const newValue = [...value]
      const increment = e.shiftKey ? step * 5 : step

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowDown":
          e.preventDefault()
          if (handle === "min") {
            newValue[0] = Math.max(min, value[0] - increment)
          } else {
            newValue[1] = Math.max(value[0] + step, value[1] - increment)
          }
          onChange(newValue)
          break
        case "ArrowRight":
        case "ArrowUp":
          e.preventDefault()
          if (handle === "min") {
            newValue[0] = Math.min(value[1] - step, value[0] + increment)
          } else {
            newValue[1] = Math.min(max, value[1] + increment)
          }
          onChange(newValue)
          break
        case "Home":
          e.preventDefault()
          if (handle === "min") {
            newValue[0] = min
          } else {
            newValue[1] = max
          }
          onChange(newValue)
          break
        case "End":
          e.preventDefault()
          if (handle === "min") {
            newValue[0] = value[1] - step
          } else {
            newValue[1] = max
          }
          onChange(newValue)
          break
      }
    },
    [value, onChange, min, max, step],
  )

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {icon}
          <Label>{label}</Label>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <HelpCircle className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Custom Slider Container */}
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
          {/* Track Fill */}
          <div
            className="absolute h-full bg-yellow-500 rounded-full transition-all duration-150"
            style={{
              left: `${valueToPosition(value[0])}%`,
              width: `${valueToPosition(value[1]) - valueToPosition(value[0])}%`,
            }}
          />

          {/* Min Handle */}
          <div
            ref={minHandleRef}
            className={`absolute top-1/2 w-6 h-6 bg-white border-2 border-yellow-500 rounded-full shadow-md cursor-grab transform -translate-y-1/2 -translate-x-1/2 transition-all duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
              isDragging === "min" ? "cursor-grabbing scale-110 ring-2 ring-yellow-500 ring-offset-2" : ""
            }`}
            style={{ left: `${valueToPosition(value[0])}%` }}
            onMouseDown={handleMouseDown("min")}
            onTouchStart={handleTouchStart("min")}
            onKeyDown={handleKeyDown("min")}
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

          {/* Max Handle */}
          <div
            ref={maxHandleRef}
            className={`absolute top-1/2 w-6 h-6 bg-white border-2 border-yellow-500 rounded-full shadow-md cursor-grab transform -translate-y-1/2 -translate-x-1/2 transition-all duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
              isDragging === "max" ? "cursor-grabbing scale-110 ring-2 ring-yellow-500 ring-offset-2" : ""
            }`}
            style={{ left: `${valueToPosition(value[1])}%` }}
            onMouseDown={handleMouseDown("max")}
            onTouchStart={handleTouchStart("max")}
            onKeyDown={handleKeyDown("max")}
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

        {/* Value Display */}
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{formatValue(value[0])}</span>
          <span className="font-medium">{formatValue(value[1])}</span>
        </div>
      </div>
    </TooltipProvider>
  )
}
