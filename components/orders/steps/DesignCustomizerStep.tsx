"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { OrderStepProps } from '@/types/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Palette, 
  Eye, 
  Save, 
  Download, 
  RefreshCw,
  Layers,
  Type,
  Image,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Maximize2
} from 'lucide-react'
import { useOrderWorkflow } from '../OrderProvider'
import { useToast } from '@/components/ui/use-toast'
import { ToolsSidebar } from '@/components/designer/tools-sidebar'
import { TextToolPanel } from '@/components/designer/text-tool-panel'
import { ImageToolPanel } from '@/components/designer/image-tool-panel'
import { CanvasArea } from '@/components/designer/canvas-area'
import type { DesignElement, Tool } from '@/types/designer'

interface DesignPreview {
  liveDataUrl?: string
  variableUrl?: string
  thumbnailUrl?: string
}

const initialElements: DesignElement[] = [
  {
    id: "template-header",
    type: "text",
    content: "Hello {{first_name}}!",
    x: 50,
    y: 50,
    width: 300,
    height: 40,
    fontSize: 24,
    fontWeight: "bold",
  },
  {
    id: "template-body",
    type: "text",
    content: "We have an exciting opportunity for you at {{address_line_1}}.",
    x: 50,
    y: 120,
    width: 400,
    height: 60,
    fontSize: 16,
    fontWeight: "normal",
  },
  {
    id: "template-signature",
    type: "text",
    content: "Best regards,\n{{sender_first}} {{sender_last}}",
    x: 50,
    y: 300,
    width: 200,
    height: 60,
    fontSize: 14,
    fontWeight: "normal",
  }
]

export function DesignCustomizerStep({ orderState }: OrderStepProps) {
  const { updateOrderState, nextStep, previousStep } = useOrderWorkflow()
  const { toast } = useToast()
  const [designPreview, setDesignPreview] = useState<DesignPreview>({})
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [isSavingDesign, setIsSavingDesign] = useState(false)
  const [activeTool, setActiveTool] = useState<Tool>("text")
  const [elements, setElements] = useState<DesignElement[]>(initialElements)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [isEmbeddedMode, setIsEmbeddedMode] = useState(true)

  // Initialize designer with template or existing design
  useEffect(() => {
    initializeDesigner()
  }, [])

  // Update elements when template changes
  useEffect(() => {
    if (orderState.design?.designJson?.elements) {
      setElements(orderState.design.designJson.elements)
    }
  }, [orderState.design?.designJson])

  const initializeDesigner = async () => {
    try {
      // If coming from template gallery, load the template
      if (orderState.design?.templateId) {
        await loadTemplate(orderState.design.templateId)
      } else if (orderState.design?.designJson?.elements) {
        // Load existing design state
        setElements(orderState.design.designJson.elements)
      }
      
      // Generate initial preview
      generatePreview()
    } catch (error) {
      console.error('Failed to initialize designer:', error)
      toast({
        title: "Design tool error",
        description: "Unable to load design tool. Please refresh and try again.",
        variant: "destructive"
      })
    }
  }

  const loadTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`)
      if (!response.ok) {
        throw new Error('Failed to load template')
      }
      
      const template = await response.json()
      
      // Load template elements into designer
      if (template.designState?.elements) {
        setElements(template.designState.elements)
        
        // Update order state with template info
        updateOrderState({
          design: {
            templateId: template.id,
            designJson: template.designState,
            variablesUsed: template.variablesUsed || [],
            isCustomDesign: false
          }
        })
      }
      
    } catch (error) {
      console.error('Failed to load template:', error)
      toast({
        title: "Template load failed",
        description: "Unable to load the selected template.",
        variant: "destructive"
      })
    }
  }

  const generatePreview = async () => {
    setIsGeneratingPreview(true)
    
    try {
      // Generate preview with live data
      const previewResponse = await fetch('/api/design/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          designState: { elements },
          contactCard: orderState.contactCard?.contactCardData,
          sampleData: orderState.accuzipValidation?.records?.[0] // Use first record as sample
        })
      })

      if (!previewResponse.ok) {
        throw new Error('Failed to generate preview')
      }

      const preview = await previewResponse.json()
      setDesignPreview({
        liveDataUrl: preview.liveDataUrl,
        variableUrl: preview.variableUrl,
        thumbnailUrl: preview.thumbnailUrl
      })

    } catch (error) {
      console.error('Failed to generate preview:', error)
      toast({
        title: "Preview generation failed",
        description: "Unable to generate design preview.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingPreview(false)
    }
  }

  const saveDesign = async () => {
    setIsSavingDesign(true)
    
    try {
      // Get current design state from embedded designer
      const designState = { elements, zoom, canvas: { width: 612, height: 792 } }
      
      // Extract variables used in the design
      const variablesUsed = extractVariablesFromDesign(designState)
      
      // Save design
      const response = await fetch('/api/design/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          designState,
          orderId: orderState.orderId,
          name: `Order Design ${new Date().toLocaleDateString()}`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save design')
      }

      const result = await response.json()
      
      updateOrderState({
        design: {
          designId: result.designId,
          designJson: designState,
          variablesUsed,
          templateId: orderState.design?.templateId,
          isCustomDesign: !orderState.design?.templateId
        }
      })

      // Regenerate preview with saved design
      generatePreview()

      toast({
        title: "Design saved",
        description: "Your design has been saved successfully."
      })

    } catch (error) {
      console.error('Failed to save design:', error)
      toast({
        title: "Save failed",
        description: "Unable to save design. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSavingDesign(false)
    }
  }

  const extractVariablesFromDesign = (designState: any): string[] => {
    const variables = new Set<string>()
    
    // Scan all text elements for variable patterns
    if (designState.elements) {
      designState.elements.forEach((element: DesignElement) => {
        if (element.type === 'text' && element.content) {
          const matches = element.content.match(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g)
          if (matches) {
            matches.forEach(match => {
              const variable = match.replace(/[{}]/g, '')
              variables.add(variable)
            })
          }
        }
      })
    }
    
    return Array.from(variables).sort()
  }

  const updateElement = useCallback((id: string, updates: Partial<DesignElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
  }, [])

  const renderToolPanel = () => {
    switch (activeTool) {
      case "text":
        return (
          <TextToolPanel
            elements={elements.filter((el) => el.type === "text")}
            selectedElementId={selectedElement}
            onSelectElement={setSelectedElement}
            onUpdateElement={updateElement}
          />
        )
      case "images":
        return <ImageToolPanel />
      default:
        return (
          <div className="p-4 text-center text-gray-500">
            <Type className="h-8 w-8 mx-auto mb-2" />
            <p>Select a tool to get started</p>
          </div>
        )
    }
  }

  const openFullDesigner = () => {
    // Open the full design tool in a new window/tab
    const designUrl = `/design?orderId=${orderState.orderId}&step=design`
    window.open(designUrl, '_blank')
  }

  const downloadPreview = async (type: 'live' | 'variable') => {
    try {
      const url = type === 'live' ? designPreview.liveDataUrl : designPreview.variableUrl
      if (!url) {
        throw new Error('Preview not available')
      }

      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `design-preview-${type}-data.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
      
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to download preview.",
        variant: "destructive"
      })
    }
  }

  const canProceed = () => {
    return orderState.design && orderState.design.designId
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Design Customizer</h2>
        <p className="text-gray-600">
          Customize your mail piece design with personalization variables
        </p>
      </div>

      {/* Design Tool Integration */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Design Canvas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Design Canvas</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEmbeddedMode(!isEmbeddedMode)}
                >
                  <Maximize2 className="h-4 w-4 mr-1" />
                  {isEmbeddedMode ? 'Expand' : 'Collapse'}
                </Button>
                <Button variant="outline" size="sm" onClick={openFullDesigner}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Full Designer
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Customize your design with an embedded design tool
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEmbeddedMode ? (
              <div className="border rounded-lg overflow-hidden bg-gray-50">
                <div className="flex h-[500px]">
                  {/* Tools Sidebar */}
                  <div className="w-16 bg-white border-r">
                    <ToolsSidebar activeTool={activeTool} onSelectTool={setActiveTool} />
                  </div>
                  
                  {/* Tool Panel */}
                  <div className="w-64 bg-white border-r overflow-y-auto">
                    {renderToolPanel()}
                  </div>
                  
                  {/* Canvas Area */}
                  <div className="flex-1 bg-gray-100 overflow-auto">
                    <CanvasArea
                      elements={elements}
                      selectedElement={selectedElement}
                      onSelectElement={setSelectedElement}
                      zoom={zoom}
                      onZoomChange={setZoom}
                      onUpdateElement={updateElement}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-[8.5/11] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Palette className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Design Canvas</h3>
                  <p className="text-gray-500 mb-4">
                    Click "Expand" or "Full Designer" to edit your design
                  </p>
                  <div className="space-x-2">
                    <Button onClick={() => setIsEmbeddedMode(true)} variant="outline">
                      <Palette className="h-4 w-4 mr-2" />
                      Expand Designer
                    </Button>
                    <Button onClick={openFullDesigner} variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Full Designer
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Live Preview</span>
            </CardTitle>
            <CardDescription>
              See how your design looks with real data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {designPreview.thumbnailUrl ? (
              <div className="space-y-4">
                <div className="aspect-[8.5/11] bg-white border rounded-lg overflow-hidden">
                  <img 
                    src={designPreview.thumbnailUrl} 
                    alt="Design preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => downloadPreview('live')}
                    disabled={!designPreview.liveDataUrl}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Live Data Version
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => downloadPreview('variable')}
                    disabled={!designPreview.variableUrl}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Variable Version
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-[8.5/11] bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  {isGeneratingPreview ? (
                    <div>
                      <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-3" />
                      <p className="text-gray-600">Generating preview...</p>
                    </div>
                  ) : (
                    <div>
                      <Eye className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-3">No preview available</p>
                      <Button variant="outline" size="sm" onClick={generatePreview}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generate Preview
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Variable Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Type className="h-5 w-5" />
            <span>Available Variables</span>
          </CardTitle>
          <CardDescription>
            Use these variables in your design for personalization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recipient Variables</h4>
              <div className="space-y-2">
                {['first_name', 'last_name', 'full_name', 'address_line_1', 'city', 'state', 'zip_code'].map(variable => (
                  <div key={variable} className="flex items-center space-x-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {`{{${variable}}}`}
                    </Badge>
                    <span className="text-sm text-gray-600 capitalize">
                      {variable.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Sender Variables</h4>
              <div className="space-y-2">
                {['sender_first', 'sender_last', 'sender_company', 'sender_phone', 'sender_email'].map(variable => (
                  <div key={variable} className="flex items-center space-x-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {`{{${variable}}}`}
                    </Badge>
                    <span className="text-sm text-gray-600 capitalize">
                      {variable.replace('sender_', '').replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Design Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Layers className="h-5 w-5" />
            <span>Design Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={saveDesign}
              disabled={isSavingDesign}
              className="flex items-center space-x-2"
            >
              {isSavingDesign ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Save Design</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={generatePreview}
              disabled={isGeneratingPreview}
            >
              {isGeneratingPreview ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="ml-2">Update Preview</span>
            </Button>
            
            <Button variant="outline" onClick={openFullDesigner}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Full Designer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Design Status */}
      {orderState.design && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Design saved successfully. {orderState.design.variablesUsed?.length || 0} personalization variables detected.
          </AlertDescription>
        </Alert>
      )}

      {!orderState.design && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please save your design before proceeding to the next step.
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={previousStep}>
          Back
        </Button>
        <Button 
          onClick={nextStep}
          disabled={!canProceed()}
        >
          Continue to Mailing Options
        </Button>
      </div>
    </div>
  )
}