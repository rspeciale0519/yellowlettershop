"use client"

import React, { useState } from 'react'
import { OrderStepProps } from '@/types/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Repeat, 
  Split, 
  Clock, 
  TrendingUp,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useOrderWorkflow } from '../OrderProvider'

export function CampaignSetupStep({ orderState }: OrderStepProps) {
  const { updateOrderState, nextStep, previousStep } = useOrderWorkflow()
  const [scheduledDate, setScheduledDate] = useState(
    orderState.campaignOptions?.scheduledStartDate 
      ? new Date(orderState.campaignOptions.scheduledStartDate).toISOString().split('T')[0]
      : ''
  )

  const handleSplitCampaignChange = (isSplitCampaign: boolean) => {
    updateOrderState({
      campaignOptions: {
        ...orderState.campaignOptions,
        isSplitCampaign,
        splitConfig: isSplitCampaign ? {
          numberOfDrops: 2,
          intervalWeeks: 2
        } : undefined
      }
    })
  }

  const handleSplitConfigChange = (field: 'numberOfDrops' | 'intervalWeeks', value: number) => {
    updateOrderState({
      campaignOptions: {
        ...orderState.campaignOptions,
        splitConfig: {
          ...orderState.campaignOptions?.splitConfig,
          [field]: value
        }
      }
    })
  }

  const handleRepeatingCampaignChange = (isRepeating: boolean) => {
    updateOrderState({
      campaignOptions: {
        ...orderState.campaignOptions,
        isRepeating,
        repeatConfig: isRepeating ? {
          frequency: 'monthly',
          repetitions: 3
        } : undefined
      }
    })
  }

  const handleRepeatConfigChange = (field: 'frequency' | 'repetitions', value: any) => {
    updateOrderState({
      campaignOptions: {
        ...orderState.campaignOptions,
        repeatConfig: {
          ...orderState.campaignOptions?.repeatConfig,
          [field]: value
        }
      }
    })
  }

  const handleScheduledDateChange = (dateString: string) => {
    setScheduledDate(dateString)
    updateOrderState({
      campaignOptions: {
        ...orderState.campaignOptions,
        scheduledStartDate: dateString ? new Date(dateString) : undefined
      }
    })
  }

  const canProceed = () => {
    // Campaign setup is optional for full service, so we can always proceed
    return true
  }

  const getFrequencyDescription = (frequency: string) => {
    switch (frequency) {
      case 'weekly':
        return 'Every week'
      case 'monthly':
        return 'Every month'
      case 'quarterly':
        return 'Every 3 months'
      default:
        return frequency
    }
  }

  const getTotalMailPieces = () => {
    const baseCount = orderState.accuzipValidation?.deliverableRecords || 0
    let multiplier = 1

    if (orderState.campaignOptions?.isSplitCampaign) {
      multiplier *= orderState.campaignOptions.splitConfig?.numberOfDrops || 1
    }

    if (orderState.campaignOptions?.isRepeating) {
      multiplier *= orderState.campaignOptions.repeatConfig?.repetitions || 1
    }

    return baseCount * multiplier
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Campaign Setup</h2>
        <p className="text-gray-600">
          Configure advanced campaign options for maximum impact
        </p>
      </div>

      {/* Campaign Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Campaign Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {orderState.accuzipValidation?.deliverableRecords || 0}
              </div>
              <div className="text-sm text-blue-800">Base Recipients</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {getTotalMailPieces()}
              </div>
              <div className="text-sm text-green-800">Total Mail Pieces</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {orderState.campaignOptions?.isSplitCampaign 
                  ? orderState.campaignOptions.splitConfig?.numberOfDrops || 1
                  : 1
                }
              </div>
              <div className="text-sm text-purple-800">Mail Drops</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Split Campaign Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Split className="h-5 w-5" />
            <span>Split Campaign</span>
          </CardTitle>
          <CardDescription>
            Increase response rates by mailing to the same recipients multiple times
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="split-campaign"
              checked={orderState.campaignOptions?.isSplitCampaign || false}
              onCheckedChange={handleSplitCampaignChange}
            />
            <Label htmlFor="split-campaign" className="font-medium">
              Enable split campaign (multiple mail drops)
            </Label>
          </div>

          {orderState.campaignOptions?.isSplitCampaign && (
            <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="num-drops">Number of Drops</Label>
                  <Input
                    id="num-drops"
                    type="number"
                    min="2"
                    max="5"
                    value={orderState.campaignOptions.splitConfig?.numberOfDrops || 2}
                    onChange={(e) => handleSplitConfigChange('numberOfDrops', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="interval">Interval (weeks)</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    max="12"
                    value={orderState.campaignOptions.splitConfig?.intervalWeeks || 2}
                    onChange={(e) => handleSplitConfigChange('intervalWeeks', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Split campaigns mail to the same recipients {orderState.campaignOptions.splitConfig?.numberOfDrops || 2} times, 
                  spaced {orderState.campaignOptions.splitConfig?.intervalWeeks || 2} weeks apart. 
                  This typically increases response rates by 40-60%.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Repeating Campaign Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Repeat className="h-5 w-5" />
            <span>Repeating Campaign</span>
          </CardTitle>
          <CardDescription>
            Automatically repeat this campaign on a regular schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="repeating-campaign"
              checked={orderState.campaignOptions?.isRepeating || false}
              onCheckedChange={handleRepeatingCampaignChange}
            />
            <Label htmlFor="repeating-campaign" className="font-medium">
              Enable repeating campaign
            </Label>
          </div>

          {orderState.campaignOptions?.isRepeating && (
            <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
              <div>
                <Label className="text-sm font-medium">Frequency</Label>
                <RadioGroup 
                  value={orderState.campaignOptions.repeatConfig?.frequency || 'monthly'}
                  onValueChange={(value) => handleRepeatConfigChange('frequency', value)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly" className="cursor-pointer">
                      Weekly ({getFrequencyDescription('weekly')})
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="cursor-pointer">
                      Monthly ({getFrequencyDescription('monthly')})
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quarterly" id="quarterly" />
                    <Label htmlFor="quarterly" className="cursor-pointer">
                      Quarterly ({getFrequencyDescription('quarterly')})
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="repetitions">Number of Repetitions</Label>
                <Input
                  id="repetitions"
                  type="number"
                  min="1"
                  max="12"
                  value={orderState.campaignOptions.repeatConfig?.repetitions || 3}
                  onChange={(e) => handleRepeatConfigChange('repetitions', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This campaign will automatically repeat {orderState.campaignOptions.repeatConfig?.repetitions || 3} times, 
                  {getFrequencyDescription(orderState.campaignOptions.repeatConfig?.frequency || 'monthly').toLowerCase()}. 
                  Each repetition will use the latest recipient data.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduling Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Campaign Scheduling</span>
          </CardTitle>
          <CardDescription>
            Schedule when your campaign should start
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="start-date">Scheduled Start Date (optional)</Label>
            <Input
              id="start-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => handleScheduledDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Leave blank to start immediately upon payment confirmation
            </p>
          </div>

          {scheduledDate && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your campaign will start on {new Date(scheduledDate).toLocaleDateString()}. 
                You can modify this date anytime before the campaign begins.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Campaign Summary */}
      {(orderState.campaignOptions?.isSplitCampaign || orderState.campaignOptions?.isRepeating) && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span>Campaign Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-green-700">
              <div>
                <strong>Base Recipients:</strong> {orderState.accuzipValidation?.deliverableRecords || 0}
              </div>
              
              {orderState.campaignOptions.isSplitCampaign && (
                <div>
                  <strong>Split Campaign:</strong> {orderState.campaignOptions.splitConfig?.numberOfDrops} drops, 
                  {orderState.campaignOptions.splitConfig?.intervalWeeks} weeks apart
                </div>
              )}
              
              {orderState.campaignOptions.isRepeating && (
                <div>
                  <strong>Repeating:</strong> {orderState.campaignOptions.repeatConfig?.repetitions} repetitions, 
                  {getFrequencyDescription(orderState.campaignOptions.repeatConfig?.frequency || 'monthly').toLowerCase()}
                </div>
              )}
              
              <div>
                <strong>Total Mail Pieces:</strong> {getTotalMailPieces().toLocaleString()}
              </div>
              
              {scheduledDate && (
                <div>
                  <strong>Start Date:</strong> {new Date(scheduledDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Campaign setup options are designed to maximize your direct mail ROI. 
          Split campaigns and repeating schedules can significantly increase response rates 
          compared to single mail drops.
        </AlertDescription>
      </Alert>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={previousStep}>
          Back
        </Button>
        <Button onClick={nextStep}>
          Continue to Review
        </Button>
      </div>
    </div>
  )
}