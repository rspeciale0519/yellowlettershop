"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash } from "lucide-react"
import { useLists } from "@/hooks/use-lists"

interface EditListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listId: string | null
  onSuccess: (updatedList: any) => void
}

export function EditListModal({ open, onOpenChange, listId, onSuccess }: EditListModalProps) {
  const { lists } = useLists()
  const [listData, setListData] = useState<any>(null)
  const [records, setRecords] = useState<Record<string, string>[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load list data when the modal opens
  useEffect(() => {
    if (open && listId && lists) {
      const list = lists.find((l) => l.id === listId)
      if (list) {
        setListData(list)

        // In a real implementation, we would fetch the actual records
        // For this example, we'll create mock records
        const mockRecords = Array.from({ length: 5 }, (_, i) => ({
          id: `record-${i}`,
          firstName: ["John", "Jane", "Bob", "Alice", "Charlie"][i],
          lastName: ["Doe", "Smith", "Johnson", "Williams", "Brown"][i],
          address: [
            `${i + 1}23 Main St`,
            `${i + 4}56 Oak Ave`,
            `${i + 7}89 Pine Rd`,
            `${i + 3}21 Elm Blvd`,
            `${i + 6}54 Maple Dr`,
          ][i],
          city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][i],
          state: ["NY", "CA", "IL", "TX", "AZ"][i],
          zipCode: ["10001", "90001", "60601", "77001", "85001"][i],
        }))

        setRecords(mockRecords)
      }
    }
  }, [open, listId, lists])

  const handleRecordChange = (index: number, field: string, value: string) => {
    const updatedRecords = [...records]
    updatedRecords[index] = { ...updatedRecords[index], [field]: value }
    setRecords(updatedRecords)
  }

  const handleAddRecord = () => {
    setRecords([
      ...records,
      { id: `record-${Date.now()}`, firstName: "", lastName: "", address: "", city: "", state: "", zipCode: "" },
    ])
  }

  const handleRemoveRecord = (index: number) => {
    setRecords(records.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!listData) return

    setIsSubmitting(true)

    try {
      // In a real implementation, this would be an API call to update the list
      // For this example, we'll simulate a successful response

      // Create an updated list object with modification tracking
      const updatedList = {
        ...listData,
        recordCount: records.length,
        modifiedDate: new Date().toISOString(),
        modifiedBy: "Current User", // In a real app, this would be the logged-in user
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onSuccess(updatedList)
    } catch (error) {
      console.error("Error updating list:", error)
      alert("Failed to update list. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!listData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit List: {listData.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="list-name">List Name</Label>
            <Input
              id="list-name"
              value={listData.name}
              onChange={(e) => setListData({ ...listData, name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Records ({records.length})</h3>
              <Button variant="outline" size="sm" onClick={handleAddRecord}>
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </div>

            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">First Name</th>
                      <th className="px-4 py-2 text-left font-medium">Last Name</th>
                      <th className="px-4 py-2 text-left font-medium">Address</th>
                      <th className="px-4 py-2 text-left font-medium">City</th>
                      <th className="px-4 py-2 text-left font-medium">State</th>
                      <th className="px-4 py-2 text-left font-medium">Zip Code</th>
                      <th className="px-4 py-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {records.map((record, index) => (
                      <tr key={record.id}>
                        <td className="px-4 py-2">
                          <Input
                            value={record.firstName}
                            onChange={(e) => handleRecordChange(index, "firstName", e.target.value)}
                            className="h-8 w-full"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={record.lastName}
                            onChange={(e) => handleRecordChange(index, "lastName", e.target.value)}
                            className="h-8 w-full"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={record.address}
                            onChange={(e) => handleRecordChange(index, "address", e.target.value)}
                            className="h-8 w-full"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={record.city}
                            onChange={(e) => handleRecordChange(index, "city", e.target.value)}
                            className="h-8 w-full"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={record.state}
                            onChange={(e) => handleRecordChange(index, "state", e.target.value)}
                            className="h-8 w-full"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={record.zipCode}
                            onChange={(e) => handleRecordChange(index, "zipCode", e.target.value)}
                            className="h-8 w-full"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRecord(index)}
                            disabled={records.length === 1}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
