"use client"

import type React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CampaignUsageTooltipProps {
  campaigns: { id: string; orderId: string; mailedDate: string }[]
  onOpenModal: (campaigns: { id: string; orderId: string; mailedDate: string }[], title: string) => void
  title?: string
  isList?: boolean
  recordCount?: number
}

export function CampaignUsageTooltip({
  campaigns,
  onOpenModal,
  title = "Campaign Usage",
  isList = false,
  recordCount = 0,
}: CampaignUsageTooltipProps) {
  // Count how many times this record has been mailed
  const mailCount = campaigns.length

  // For lists, calculate the percentage breakdown of mail frequency
  // In a real implementation, this would be calculated from actual data
  // Here we're simulating it for demonstration purposes
  const getMailFrequencyBreakdown = () => {
    if (!isList || recordCount === 0) return null

    // Generate a realistic distribution of mail frequencies
    // This would normally come from the database
    const frequencies: { count: number; percentage: number; times: number }[] = []

    // Create a distribution that adds up to 100%
    let remainingPercentage = 100
    let remainingRecords = recordCount

    // Generate frequencies for 1-5 times
    for (let i = 1; i <= 5; i++) {
      // Skip the last iteration to ensure we don't go over 100%
      if (i === 5) {
        frequencies.push({
          times: i,
          percentage: remainingPercentage,
          count: remainingRecords,
        })
        break
      }

      // Generate a random percentage for this frequency
      // More heavily weighted toward lower frequencies
      const maxPercentage = Math.min(remainingPercentage - 5, 50 / i)
      const percentage = Math.max(5, Math.floor(Math.random() * maxPercentage))

      // Calculate the record count for this percentage
      const count = Math.floor((percentage / 100) * recordCount)

      frequencies.push({
        times: i,
        percentage,
        count,
      })

      remainingPercentage -= percentage
      remainingRecords -= count
    }

    return frequencies
  }

  const mailFrequencyBreakdown = getMailFrequencyBreakdown()

  // Function to handle click on the "Click to view details" text
  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onOpenModal(campaigns, title)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onOpenModal(campaigns, title)
            }}
          >
            <Mail className="h-4 w-4 mr-1" />
            {isList ? (
              <span>
                {campaigns.length > 0
                  ? `${campaigns.length} campaign${campaigns.length > 1 ? "s" : ""}`
                  : "No campaigns"}
              </span>
            ) : (
              <span>
                {campaigns.length > 0
                  ? `Mailed ${campaigns.length} time${campaigns.length > 1 ? "s" : ""}`
                  : "Never mailed"}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="w-[300px]">
          <div className="space-y-2">
            {isList ? (
              <>
                <div className="font-medium">Campaign Usage</div>
                {mailFrequencyBreakdown && mailFrequencyBreakdown.length > 0 ? (
                  <div className="space-y-1 text-sm">
                    <div className="font-medium text-xs text-muted-foreground mb-1">Mail Frequency Breakdown:</div>
                    {mailFrequencyBreakdown.map((freq) => (
                      <div key={freq.times} className="flex justify-between">
                        <span>
                          Mailed {freq.times} time{freq.times !== 1 ? "s" : ""}:
                        </span>
                        <span className="font-medium">
                          {freq.percentage}% ({freq.count} records)
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No mailing data available</div>
                )}
              </>
            ) : (
              <>
                <div className="font-medium">
                  {mailCount > 0 ? `Mailed ${mailCount} time${mailCount !== 1 ? "s" : ""}` : "Never mailed"}
                </div>
              </>
            )}

            {campaigns.length > 0 && (
              <>
                <div className="font-medium text-xs text-muted-foreground mt-3 mb-1">
                  {isList ? "Recent Campaigns:" : "Campaign Details:"}
                </div>
                <ScrollArea className="h-[120px]">
                  <div className="space-y-2">
                    {campaigns.slice(0, isList ? 3 : undefined).map((campaign) => (
                      <div key={campaign.id} className="text-sm">
                        <div className="font-medium">Order #{campaign.orderId}</div>
                        <div className="text-muted-foreground">
                          Mailed: {new Date(campaign.mailedDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    {isList && campaigns.length > 3 && (
                      <div className="text-sm text-muted-foreground">+{campaigns.length - 3} more campaigns</div>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
            <div className="text-xs text-blue-600 pt-1 cursor-pointer hover:underline" onClick={handleDetailsClick}>
              Click to view details
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
