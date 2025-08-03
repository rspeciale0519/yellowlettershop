import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CampaignUsageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaigns: { id: string; orderId: string; mailedDate: string }[]
  title: string
  isList?: boolean
  recordCount?: number
}

export function CampaignUsageModal({
  open,
  onOpenChange,
  campaigns,
  title,
  isList = false,
  recordCount = 0,
}: CampaignUsageModalProps) {
  // Determine if this is a list or a record based on the title
  const isListView = isList || title.includes("List") || title.includes("list")

  // Count how many times this record has been mailed
  const mailCount = campaigns.length

  // For lists, calculate the percentage breakdown of mail frequency
  // In a real implementation, this would be calculated from actual data
  // Here we're simulating it for demonstration purposes
  const getMailFrequencyBreakdown = () => {
    if (!isListView || recordCount === 0) return null

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isListView ? (
            <>
              {mailFrequencyBreakdown && mailFrequencyBreakdown.length > 0 ? (
                <div className="space-y-2 mb-6">
                  <h3 className="font-medium text-sm">Mail Frequency Breakdown:</h3>
                  <div className="space-y-1 pl-2">
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
                </div>
              ) : null}
            </>
          ) : (
            <div className="mb-4 font-medium">
              {mailCount > 0 ? `Mailed ${mailCount} time${mailCount !== 1 ? "s" : ""}` : "Never mailed"}
            </div>
          )}

          {campaigns.length > 0 ? (
            <>
              <h3 className="font-medium text-sm mb-2">{isListView ? "Campaign History:" : "Campaign Details:"}</h3>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="border-b pb-3 last:border-0">
                      <div className="font-medium">Order #{campaign.orderId}</div>
                      <div className="text-muted-foreground">
                        Mailed: {new Date(campaign.mailedDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No campaign history available</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
