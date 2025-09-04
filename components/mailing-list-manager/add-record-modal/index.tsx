"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { ListSelector } from "./list-selector"
import { BasicInfoForm } from "./basic-info-form"
import { CustomFieldsForm } from "./custom-fields-form"
import { validateForm, initializeCustomFields } from "./utils"
import type { AddRecordModalProps, FormData } from "./types"
import { getCustomFieldsForList } from "./types"

export function AddRecordModal({ open, onOpenChange, onSuccess, lists, onCreateNewList }: AddRecordModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [listOption, setListOption] = useState<"existing" | "new">("existing")
  const [selectedListId, setSelectedListId] = useState<string>("")
  const [newListName, setNewListName] = useState("")
  const [activeTab, setActiveTab] = useState("basic")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Basic form fields
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  })

  // Custom fields based on list type
  const [customFields, setCustomFields] = useState<Record<string, any>>({})

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
    })
    setCustomFields({})
    setListOption("existing")
    setSelectedListId("")
    setNewListName("")
    setErrors({})
    setActiveTab("basic")
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleCustomFieldChange = (field: string, value: any) => {
    setCustomFields((prev) => ({ ...prev, [field]: value }))

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleListChange = (listId: string) => {
    setSelectedListId(listId)

    // Reset custom fields when list changes
    setCustomFields({})

    // Get the selected list name
    if (lists) {
      const selectedList = lists.find((list) => list.id === listId)
      if (selectedList) {
        // Initialize custom fields with default values
        const fields = getCustomFieldsForList(selectedList.name)
        const initialValues = initializeCustomFields(fields)
        setCustomFields(initialValues)
      }
    }
  }

  const handleSubmit = async () => {
    const formErrors = validateForm(formData, listOption, selectedListId, newListName)
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    setIsSubmitting(true)

    try {
      let listId = selectedListId
      let listName = ""

      // If creating a new list, do that first
      if (listOption === "new") {
        try {
          const newList = await onCreateNewList(newListName)
          listId = newList.id
          listName = newList.name
        } catch (error) {
          console.error("Error creating new list:", error)
          toast({
            title: "Error",
            description: "Failed to create new list. Please try again.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      } else {
        // Get the name of the selected list
        const selectedList = lists?.find((list) => list.id === selectedListId)
        listName = selectedList?.name || ""
      }

      // Create a record object with all form values
      const newRecord = {
        id: `record-${Date.now()}`,
        ...formData,
        ...customFields,
        listId,
        listName,
        tags: [],
        campaigns: [],
        createdDate: new Date().toISOString(),
        createdBy: "Current User", // In a real app, this would be the logged-in user
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onSuccess(newRecord)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error creating record:", error)
      toast({
        title: "Error",
        description: "Failed to create record. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get custom fields for the selected list
  const selectedListName = lists?.find((list) => list.id === selectedListId)?.name || ""
  const customFieldDefinitions = getCustomFieldsForList(selectedListName)

  // Determine if we should show the custom fields tab
  const hasCustomFields = customFieldDefinitions.length > 0

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm()
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Record</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <ListSelector
            listOption={listOption}
            selectedListId={selectedListId}
            newListName={newListName}
            lists={lists}
            errors={errors}
            onListOptionChange={setListOption}
            onListChange={handleListChange}
            onNewListNameChange={setNewListName}
          />

          <div className="border-t pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h3 className="font-medium">Record Information</h3>

                <TabsList className="mt-2 sm:mt-0">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  {hasCustomFields && <TabsTrigger value="custom">Additional Fields</TabsTrigger>}
                </TabsList>
              </div>

              <TabsContent value="basic">
                <BasicInfoForm formData={formData} errors={errors} onInputChange={handleInputChange} />
              </TabsContent>

              {hasCustomFields && (
                <TabsContent value="custom">
                  <CustomFieldsForm
                    customFieldDefinitions={customFieldDefinitions}
                    customFields={customFields}
                    errors={errors}
                    onCustomFieldChange={handleCustomFieldChange}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
