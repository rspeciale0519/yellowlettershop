"use client"

import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Map as MapIcon, Info as InfoIcon } from 'lucide-react'

type MapViewProps = {
  mapUrl?: string;
  onOpenMap?: () => void;
};

export function MapView() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <MapIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Use our interactive map to draw custom shapes or set radius areas for precise geographic targeting.
        </p>
      </div>
      <Button variant="outline" className="w-full bg-transparent">
        <MapIcon className="h-4 w-4 mr-2" />
        Open Interactive Map
      </Button>
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Map functionality will open in a new window where you can draw polygons or set radius areas.
        </AlertDescription>
      </Alert>
    </div>
  )
}