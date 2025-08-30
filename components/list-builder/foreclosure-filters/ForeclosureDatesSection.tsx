"use client";

import { CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { ForeclosureCriteria } from "@/types/list-builder"

interface ForeclosureDatesSectionProps {
  criteria: ForeclosureCriteria
  onCriteriaToggle: (criterion: string) => void
  onDateRangeUpdate: (field: string, type: "from" | "to", date: Date | undefined) => void
}

export function ForeclosureDatesSection({
  criteria,
  onCriteriaToggle,
  onDateRangeUpdate,
}: ForeclosureDatesSectionProps) {
  return (
    <CardContent className="pt-0">
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="foreclosure-date"
            checked={(criteria.selectedCriteria || []).includes("foreclosure-date")}
            onCheckedChange={() => onCriteriaToggle("foreclosure-date")}
          />
          <Label htmlFor="foreclosure-date" className="font-medium">
            Filter by Foreclosure Date
          </Label>
        </div>

        {(criteria.selectedCriteria || []).includes("foreclosure-date") && (
          <div className="ml-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !criteria.foreclosureDate?.from && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {criteria.foreclosureDate?.from ? (
                        format(new Date(criteria.foreclosureDate.from), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        criteria.foreclosureDate?.from ? new Date(criteria.foreclosureDate.from) : undefined
                      }
                      onSelect={(date) => onDateRangeUpdate("foreclosureDate", "from", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-sm font-medium">To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !criteria.foreclosureDate?.to && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {criteria.foreclosureDate?.to ? (
                        format(new Date(criteria.foreclosureDate.to), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        criteria.foreclosureDate?.to ? new Date(criteria.foreclosureDate.to) : undefined
                      }
                      onSelect={(date) => onDateRangeUpdate("foreclosureDate", "to", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="auction-date"
            checked={(criteria.selectedCriteria || []).includes("auction-date")}
            onCheckedChange={() => onCriteriaToggle("auction-date")}
          />
          <Label htmlFor="auction-date" className="font-medium">
            Filter by Auction Date
          </Label>
        </div>

        {(criteria.selectedCriteria || []).includes("auction-date") && (
          <div className="ml-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !criteria.auctionDate?.from && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {criteria.auctionDate?.from ? (
                        format(new Date(criteria.auctionDate.from), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        criteria.auctionDate?.from ? new Date(criteria.auctionDate.from) : undefined
                      }
                      onSelect={(date) => onDateRangeUpdate("auctionDate", "from", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-sm font-medium">To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !criteria.auctionDate?.to && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {criteria.auctionDate?.to ? (
                        format(new Date(criteria.auctionDate.to), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={criteria.auctionDate?.to ? new Date(criteria.auctionDate.to) : undefined}
                      onSelect={(date) => onDateRangeUpdate("auctionDate", "to", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}
      </div>
    </CardContent>
  )
}