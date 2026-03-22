import { Card, CardContent } from "@/components/ui/card"
import { FileIcon, ImageIcon, HardDrive, FileText, FileSpreadsheet, Type } from "lucide-react"

interface MediaStatsProps {
  stats: {
    totalFiles: number
    totalSize: string
    imageCount: number
    documentCount: number
    pdfCount: number
    spreadsheetCount: number
    fontCount: number
  } | null
  onFilterByType?: (type: string) => void
}

export function MediaStats({ stats, onFilterByType }: MediaStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[...Array(7)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                <div>
                  <div className="h-4 w-16 bg-muted animate-pulse rounded mb-1" />
                  <div className="h-6 w-8 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      type: 'all',
      label: 'Total Files',
      count: stats.totalFiles,
      icon: FileIcon,
      color: 'text-muted-foreground'
    },
    {
      type: 'image',
      label: 'Images',
      count: stats.imageCount,
      icon: ImageIcon,
      color: 'text-blue-500'
    },
    {
      type: 'document',
      label: 'Documents',
      count: stats.documentCount,
      icon: FileText,
      color: 'text-green-500'
    },
    {
      type: 'pdf',
      label: 'PDFs',
      count: stats.pdfCount,
      icon: FileText,
      color: 'text-red-500'
    },
    {
      type: 'spreadsheet',
      label: 'Spreadsheets',
      count: stats.spreadsheetCount,
      icon: FileSpreadsheet,
      color: 'text-emerald-500'
    },
    {
      type: 'font',
      label: 'Fonts',
      count: stats.fontCount,
      icon: Type,
      color: 'text-purple-500'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {statCards.map((stat) => (
        <Card
          key={stat.type}
          className={onFilterByType ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
          onClick={() => onFilterByType?.(stat.type)}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <HardDrive className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Total Size</p>
              <p className="text-2xl font-bold">{stats.totalSize}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}