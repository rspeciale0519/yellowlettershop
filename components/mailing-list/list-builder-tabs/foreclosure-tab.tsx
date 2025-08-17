"use client"

import React, { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { ListCriteria } from '@/lib/supabase/mailing-lists'

interface ForeclosureTabProps {
  criteria: ListCriteria
  setCriteria: React.Dispatch<React.SetStateAction<ListCriteria>>
  onEstimateUpdate?: (count: number) => void
}

const FORECLOSURE_STATUSES = [
  'Pre-Foreclosure',
  'Auction',
  'Bank Owned',
  'REO',
  'Short Sale',
  'Notice of Default',
  'Notice of Sale'
]

export function ForeclosureTab({ criteria, setCriteria, onEstimateUpdate }: ForeclosureTabProps) {
  const [filingDateRange, setFilingDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [auctionDateRange, setAuctionDateRange] = useState<{ from?: Date; to?: Date }>({})

  const selectedStatuses = criteria.foreclosure?.status || []

  const handleStatusToggle = (status: string) => {
    setCriteria(prev => {
      const currentStatuses = prev.foreclosure?.status || []
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter(s => s !== status)
        : [...currentStatuses, status]

      return {
        ...prev,
        foreclosure: {
          ...prev.foreclosure,
          status: newStatuses.length > 0 ? newStatuses : undefined
        }
      }
    })
  }

  const updateFilingDateRange = (dates: { from?: Date; to?: Date }) => {
    setFilingDateRange(dates)
    setCriteria(prev => ({
      ...prev,
      foreclosure: {
        ...prev.foreclosure,
        filingDate: dates.from || dates.to
          ? { start: dates.from, end: dates.to }
          : undefined
      }
    }))
  }

  const updateAuctionDateRange = (dates: { from?: Date; to?: Date }) => {
    setAuctionDateRange(dates)
    setCriteria(prev => ({
      ...prev,
      foreclosure: {
        ...prev.foreclosure,
        auctionDate: dates.from || dates.to
          ? { start: dates.from, end: dates.to }
          : undefined
      }
    }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        {/* Foreclosure Statuses */}
        <div>
          <Label>Foreclosure Status</Label>
          <div className="space-y-2 mt-2">
            {FORECLOSURE_STATUSES.map(status => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`foreclosure-${status}`}
                  checked={selectedStatuses.includes(status)}
                  onCheckedChange={() => handleStatusToggle(status)}
                />
                <label htmlFor={`foreclosure-${status}`} className="text-sm cursor-pointer">
                  {status}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Date Ranges */}
        <div className="space-y-4">
          <div>
            <Label>Filing Date Range</Label>
            <div className="flex gap-2 mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filingDateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filingDateRange.from ? format(filingDateRange.from, "PPP") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filingDateRange.from}
                    onSelect={(date) => updateFilingDateRange({ ...filingDateRange, from: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filingDateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filingDateRange.to ? format(filingDateRange.to, "PPP") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filingDateRange.to}
                    onSelect={(date) => updateFilingDateRange({ ...filingDateRange, to: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label>Auction Date Range</Label>
            <div className="flex gap-2 mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !auctionDateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {auctionDateRange.from ? format(auctionDateRange.from, "PPP") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={auctionDateRange.from}
                    onSelect={(date) => updateAuctionDateRange({ ...auctionDateRange, from: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !auctionDateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {auctionDateRange.to ? format(auctionDateRange.to, "PPP") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={auctionDateRange.to}
                    onSelect={(date) => updateAuctionDateRange({ ...auctionDateRange, to: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
