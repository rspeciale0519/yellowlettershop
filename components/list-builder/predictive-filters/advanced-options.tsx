"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface AdvancedOptionsProps {
  showAdvanced: boolean
  customThreshold: number
  includeUncertain: boolean
  onShowAdvancedChange: (show: boolean) => void
  onCustomThresholdChange: (threshold: number) => void
  onIncludeUncertainChange: (include: boolean) => void
}

export function AdvancedOptions({
  showAdvanced,
  customThreshold,
  includeUncertain,
  onShowAdvancedChange,
  onCustomThresholdChange,
  onIncludeUncertainChange,
}: AdvancedOptionsProps) {
  return (
    <Card>
      <Collapsible open={showAdvanced} onOpenChange={onShowAdvancedChange}>
-        <CollapsibleTrigger asChild>
-          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
-            <div className="flex items-center justify-between">
-              <div>
-                <CardTitle className="text-base">Advanced Options</CardTitle>
-                <CardDescription>
-                  Fine-tune predictive filtering behavior
-                </CardDescription>
-              </div>
-              <Button variant="ghost" size="sm">
-                {showAdvanced ? (
-                  <ChevronUp className="h-4 w-4" />
-                ) : (
-                  <ChevronDown className="h-4 w-4" />
-                )}
-              </Button>
-            </div>
-          </CardHeader>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Advanced Options</CardTitle>
                <CardDescription>Fine-tune predictive filtering behavior</CardDescription>
              </div>
              <span aria-hidden="true" className="text-muted-foreground">
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="include-uncertain">Include Uncertain Predictions</Label>
                  <p className="text-sm text-muted-foreground">
                    Include recipients with low confidence scores
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-uncertain"
                    checked={includeUncertain}
                    onCheckedChange={onIncludeUncertainChange}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Info className="h-4 w-4" />
                 <Slider
                   id="custom-threshold"
                   value={[customThreshold]}
                   onValueChange={(values: number[]) =>
                     onCustomThresholdChange(
                       Math.max(0, Math.min(100, values?.[0] ?? customThreshold))
                     )
                   }
                   max={100}
                   min={0}
                   step={5}
                   className="w-full"
                   aria-describedby="custom-threshold-help"
                 />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-threshold">Custom Confidence Threshold</Label>
                  <span className="text-sm text-muted-foreground">{customThreshold}%</span>
                </div>
                <Slider
                  id="custom-threshold"
                  value={[customThreshold]}
                  onValueChange={(values) => onCustomThresholdChange(values[0])}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Low Confidence</span>
                  <span>High Confidence</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Only include predictions with confidence above this threshold
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">MODEL PERFORMANCE</Label>
                    <div className="mt-1 space-y-1">
                      <div className="flex justify-between">
                        <span>Precision:</span>
                        <span className="font-medium">78.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recall:</span>
                        <span className="font-medium">82.1%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">COVERAGE</Label>
                    <div className="mt-1 space-y-1">
                      <div className="flex justify-between">
                        <span>High Conf:</span>
                        <span className="font-medium">65%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medium Conf:</span>
                        <span className="font-medium">28%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
                      <div className="flex justify-between">
                        <span>Medium Conf:</span>
                        <span className="font-medium">28%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
