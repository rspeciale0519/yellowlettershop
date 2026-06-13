'use client'

import { Button } from '@/components/ui/button'
import { Upload, List, Plus } from 'lucide-react'
import { OrderState, ListDataSelection } from '@/types/orders'

// This flow tracks a UI-level data-source discriminator on listData that is
// distinct from the persisted `dataSource` enum. It is written via the loosely
// typed onDataComplete callback, so reads are surfaced through this augmentation.
type ListDataWithSource = ListDataSelection & {
  source?: 'upload' | 'existing' | 'manual'
}

interface DataSourceSelectionButtonsProps {
  orderState: OrderState
  onDataComplete: (listData: any) => void
}

export function DataSourceSelectionButtons({
  orderState,
  onDataComplete
}: DataSourceSelectionButtonsProps) {

  const handleUploadClick = () => {
    onDataComplete({
      source: 'upload',
      useMailingData: true,
      dataSource: 'upload'
    })
  }

  const handleExistingListClick = () => {
    onDataComplete({
      source: 'existing',
      useMailingData: true,
      dataSource: 'mlm_select'
    })
  }

  const handleManualEntryClick = () => {
    onDataComplete({
      source: 'manual',
      useMailingData: true,
      dataSource: 'manual_entry',
      manualRecords: []
    })
  }

  const currentSource =
    (orderState.dataAndMapping?.listData as ListDataWithSource | undefined)?.source ||
    (orderState.listData as ListDataWithSource | undefined)?.source

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Choose Your Data Source</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant={currentSource === 'upload' ? 'default' : 'outline'}
          className="h-24 flex flex-col items-center justify-center space-y-2"
          onClick={handleUploadClick}
        >
          <Upload className="h-6 w-6" />
          <span>Upload File</span>
        </Button>

        <Button
          variant={currentSource === 'existing' ? 'default' : 'outline'}
          className="h-24 flex flex-col items-center justify-center space-y-2"
          onClick={handleExistingListClick}
        >
          <List className="h-6 w-6" />
          <span>Existing List</span>
        </Button>

        <Button
          variant={currentSource === 'manual' ? 'default' : 'outline'}
          className="h-24 flex flex-col items-center justify-center space-y-2"
          onClick={handleManualEntryClick}
        >
          <Plus className="h-6 w-6" />
          <span>Manual Entry</span>
        </Button>
      </div>
    </div>
  )
}