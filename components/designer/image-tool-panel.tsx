import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

export function ImageToolPanel() {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Images</h3>
      <Button variant="outline" className="w-full bg-transparent">
        <Upload className="h-4 w-4 mr-2" />
        Upload Image
      </Button>
      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Your uploaded images will appear here.
      </div>
    </div>
  )
}
