"use client"

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { createListFromCriteria, type ListCriteria } from '@/lib/supabase/mailing-lists'
import { 
  MapPin, 
  Home, 
  Building, 
  Users, 
  AlertCircle, 
  TrendingUp,
  Loader2
} from "lucide-react"
import { GeographyTab } from './list-builder-tabs/geography-tab'
import { MortgageTab } from './list-builder-tabs/mortgage-tab'
import { PropertyTab } from './list-builder-tabs/property-tab'
import { DemographicsTab } from './list-builder-tabs/demographics-tab'
import { ForeclosureTab } from './list-builder-tabs/foreclosure-tab'
import { PredictiveTab } from './list-builder-tabs/predictive-tab'

interface ListBuilderProps {
  onSuccess?: (listId: string) => void
  onCancel?: () => void
}

export function ListBuilder({ onSuccess, onCancel }: ListBuilderProps) {
  const [listName, setListName] = useState('')
  const [activeTab, setActiveTab] = useState('geography')
  const [isCreating, setIsCreating] = useState(false)
  const [estimatedCount, setEstimatedCount] = useState(0)
  
  // Criteria state
  const [criteria, setCriteria] = useState<ListCriteria>({
    geography: {},
    mortgage: {},
    property: {},
    demographics: {},
    foreclosure: {},
    predictiveAnalytics: {}
  })

  const handleCreateList = async () => {
    if (!listName) {
      toast({
        title: "List name required",
        description: "Please enter a name for your mailing list.",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)

    try {
      const list = await createListFromCriteria(listName, criteria)
      toast({
        title: "List created successfully",
        description: `Your mailing list "${listName}" has been created.`
      })
      if (onSuccess) {
        onSuccess(list.id)
      }
    } catch (error) {
      console.error('Error creating list:', error)
      toast({
        title: "Error creating list",
        description: "There was an error creating your mailing list. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const getCriteriaSummary = () => {
    const summary = []
    
    if (criteria.geography?.states?.length) {
      summary.push(`${criteria.geography.states.length} state${criteria.geography.states.length > 1 ? 's' : ''}`)
    }
    if (criteria.geography?.cities?.length) {
      summary.push(`${criteria.geography.cities.length} cit${criteria.geography.cities.length > 1 ? 'ies' : 'y'}`)
    }
    if (criteria.geography?.zipCodes?.length) {
      summary.push(`${criteria.geography.zipCodes.length} zip code${criteria.geography.zipCodes.length > 1 ? 's' : ''}`)
    }
    if (criteria.mortgage?.loanType?.length) {
      summary.push(`${criteria.mortgage.loanType.length} loan type${criteria.mortgage.loanType.length > 1 ? 's' : ''}`)
    }
    if (criteria.property?.propertyType?.length) {
      summary.push(`${criteria.property.propertyType.length} property type${criteria.property.propertyType.length > 1 ? 's' : ''}`)
    }
    
    return summary.length > 0 ? summary.join(', ') : 'No criteria selected'
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Create Mailing List</CardTitle>
        <CardDescription>
          Build a targeted mailing list by selecting criteria across different categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* List Name Input */}
          <div>
            <Label htmlFor="list-name">List Name</Label>
            <Input
              id="list-name"
              placeholder="Enter list name..."
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Current Criteria Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Current Criteria</p>
                <p className="text-sm text-muted-foreground mt-1">{getCriteriaSummary()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Estimated Records</p>
                <p className="text-2xl font-bold">{estimatedCount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Criteria Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="geography" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Geography
              </TabsTrigger>
              <TabsTrigger value="mortgage" className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                Mortgage
              </TabsTrigger>
              <TabsTrigger value="property" className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                Property
              </TabsTrigger>
              <TabsTrigger value="demographics" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Demographics
              </TabsTrigger>
              <TabsTrigger value="foreclosure" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Foreclosure
              </TabsTrigger>
              <TabsTrigger value="predictive" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Predictive
              </TabsTrigger>
            </TabsList>

            <TabsContent value="geography">
              <GeographyTab 
                criteria={criteria} 
                setCriteria={setCriteria}
                onEstimateUpdate={setEstimatedCount}
              />
            </TabsContent>

            <TabsContent value="mortgage">
              <MortgageTab 
                criteria={criteria} 
                setCriteria={setCriteria}
                onEstimateUpdate={setEstimatedCount}
              />
            </TabsContent>

            <TabsContent value="property">
              <PropertyTab 
                criteria={criteria} 
                setCriteria={setCriteria}
                onEstimateUpdate={setEstimatedCount}
              />
            </TabsContent>

            <TabsContent value="demographics">
              <DemographicsTab 
                criteria={criteria} 
                setCriteria={setCriteria}
                onEstimateUpdate={setEstimatedCount}
              />
            </TabsContent>

            <TabsContent value="foreclosure">
              <ForeclosureTab 
                criteria={criteria} 
                setCriteria={setCriteria}
                onEstimateUpdate={setEstimatedCount}
              />
            </TabsContent>

            <TabsContent value="predictive">
              <PredictiveTab 
                criteria={criteria} 
                setCriteria={setCriteria}
                onEstimateUpdate={setEstimatedCount}
              />
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setCriteria({
                    geography: {},
                    mortgage: {},
                    property: {},
                    demographics: {},
                    foreclosure: {},
                    predictiveAnalytics: {}
                  })
                  setEstimatedCount(0)
                }}
                disabled={isCreating}
              >
                Clear All
              </Button>
              <Button 
                onClick={handleCreateList}
                disabled={isCreating || !listName}
              >
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create List
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
