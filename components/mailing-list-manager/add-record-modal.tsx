"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AddRecordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (newRecord: any) => void
  lists: any[] | undefined
  onCreateNewList: (listName: string) => Promise<any>
}

export function AddRecordModal({ open, onOpenChange, onSuccess, lists, onCreateNewList }: AddRecordModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [listOption, setListOption] = useState<"existing" | "new">("existing")
  const [selectedListId, setSelectedListId] = useState<string>("")
  const [newListName, setNewListName] = useState("")
  const [activeTab, setActiveTab] = useState("basic")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Basic form fields
  const [formData, setFormData] = useState({
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

  // Get custom field definitions based on selected list
  const getCustomFieldsForList = (listName: string) => {
    if (!listName) return []

    const fields = []

    // Add fields based on list name
    if (listName.toLowerCase().includes("investor")) {
      fields.push(
        { id: "investmentBudget", name: "Investment Budget", type: "number" },
        {
          id: "preferredPropertyType",
          name: "Preferred Property Type",
          type: "select",
          options: ["Single Family", "Multi-Family", "Commercial", "Land", "Any"],
        },
        { id: "cashBuyer", name: "Cash Buyer", type: "checkbox" },
      )
    } else if (listName.toLowerCase().includes("homeowner")) {
      fields.push(
        { id: "propertyValue", name: "Estimated Property Value", type: "number" },
        { id: "yearBuilt", name: "Year Built", type: "number" },
        { id: "squareFootage", name: "Square Footage", type: "number" },
      )
    } else if (listName.toLowerCase().includes("seller")) {
      fields.push(
        {
          id: "motivationLevel",
          name: "Motivation Level",
          type: "select",
          options: ["High", "Medium", "Low", "Unknown"],
        },
        { id: "askingPrice", name: "Asking Price", type: "number" },
      )
    }

    // Add common fields for all lists
    fields.push(
      { id: "notes", name: "Notes", type: "text" },
      {
        id: "leadSource",
        name: "Lead Source",
        type: "select",
        options: ["Direct Mail", "Website", "Referral", "Cold Call", "Other"],
      },
    )

    return fields
  }

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
        const initialValues: Record<string, any> = {}

        fields.forEach((field) => {
          if (field.type === "checkbox") {
            initialValues[field.id] = false
          } else if (field.type === "select" && field.options) {
            initialValues[field.id] = field.options[0]
          } else {
            initialValues[field.id] = ""
          }
        })

        setCustomFields(initialValues)
      }
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate required fields
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (!formData.city.trim()) newErrors.city = "City is required"
    if (!formData.state.trim()) newErrors.state = "State is required"
    if (!formData.zipCode.trim()) newErrors.zipCode = "Zip code is required"

    // Validate list selection
    if (listOption === "existing" && !selectedListId) {
      newErrors.selectedListId = "Please select a mailing list"
    } else if (listOption === "new" && !newListName.trim()) {
      newErrors.newListName = "Please enter a name for the new list"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

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

      // In a real implementation, this would be an API call to create the record
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
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Select Mailing List</Label>
              <RadioGroup
                value={listOption}
                onValueChange={(value) => setListOption(value as "existing" | "new")}
                className="flex flex-row flex-wrap gap-x-6 gap-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="existing-list" />
                  <Label htmlFor="existing-list" className="font-normal">
                    Use existing list
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new-list" />
                  <Label htmlFor="new-list" className="font-normal">
                    Create new list
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {listOption === "existing" ? (
              <div>
                <Label htmlFor="list-select">Select a mailing list</Label>
                <Select value={selectedListId} onValueChange={handleListChange} disabled={lists?.length === 0}>
                  <SelectTrigger id="list-select" className="mt-1">
                    <SelectValue placeholder="Select a mailing list" />
                  </SelectTrigger>
                  <SelectContent>
                    {lists?.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name} ({list.recordCount.toLocaleString()} records)
                      </SelectItem>
                    ))}
                    {(!lists || lists.length === 0) && (
                      <div className="px-2 py-4 text-center text-muted-foreground">No mailing lists available</div>
                    )}
                  </SelectContent>
                </Select>
                {errors.selectedListId && <p className="text-sm text-destructive mt-1">{errors.selectedListId}</p>}
              </div>
            ) : (
              <div>
                <Label htmlFor="new-list-name">New list name</Label>
                <Input
                  id="new-list-name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., New York Leads 2025"
                  className="mt-1"
                />
                {errors.newListName && <p className="text-sm text-destructive mt-1">{errors.newListName}</p>}
              </div>
            )}

            <div className="border-t pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <h3 className="font-medium">Record Information</h3>

                  <TabsList className="mt-2 sm:mt-0">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    {hasCustomFields && <TabsTrigger value="custom">Additional Fields</TabsTrigger>}
                  </TabsList>
                </div>

                <TabsContent value="basic" className="space-y-4 mt-0">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-4">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          className="mt-1"
                          placeholder="Enter first name"
                        />
                        {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName}</p>}
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          className="mt-1"
                          placeholder="Enter last name"
                        />
                        {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName}</p>}
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className="mt-1"
                          placeholder="Enter email address"
                        />
                        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          className="mt-1"
                          placeholder="Enter phone number"
                        />
                        {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-4">Address Information</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          className="mt-1"
                          placeholder="Enter street address"
                        />
                        {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => handleInputChange("city", e.target.value)}
                            className="mt-1"
                            placeholder="Enter city"
                          />
                          {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              value={formData.state}
                              onChange={(e) => handleInputChange("state", e.target.value.toUpperCase())}
                              className="mt-1"
                              placeholder="e.g., CA"
                              maxLength={2}
                            />
                            {errors.state && <p className="text-sm text-destructive mt-1">{errors.state}</p>}
                          </div>
                          <div>
                            <Label htmlFor="zipCode">Zip Code</Label>
                            <Input
                              id="zipCode"
                              value={formData.zipCode}
                              onChange={(e) => handleInputChange("zipCode", e.target.value)}
                              className="mt-1"
                              placeholder="e.g., 90210"
                              maxLength={10}
                            />
                            {errors.zipCode && <p className="text-sm text-destructive mt-1">{errors.zipCode}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {hasCustomFields && (
                  <TabsContent value="custom" className="space-y-4 mt-0">
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-4">Additional Fields</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customFieldDefinitions.map((field) => {
                          const value = customFields[field.id] !== undefined ? customFields[field.id] : ""
                          const error = errors[field.id]

                          switch (field.type) {
                            case "text":
                              return (
                                <div key={field.id}>
                                  <Label htmlFor={field.id}>{field.name}</Label>
                                  <Input
                                    id={field.id}
                                    value={value}
                                    onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                                    className="mt-1"
                                    placeholder={`Enter ${field.name.toLowerCase()}`}
                                  />
                                  {error && <p className="text-sm text-destructive mt-1">{error}</p>}
                                </div>
                              )

                            case "number":
                              return (
                                <div key={field.id}>
                                  <Label htmlFor={field.id}>{field.name}</Label>
                                  <Input
                                    id={field.id}
                                    type="number"
                                    value={value}
                                    onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                                    className="mt-1"
                                    placeholder={`Enter ${field.name.toLowerCase()}`}
                                  />
                                  {error && <p className="text-sm text-destructive mt-1">{error}</p>}
                                </div>
                              )

                            case "select":
                              return (
                                <div key={field.id}>
                                  <Label htmlFor={field.id}>{field.name}</Label>
                                  <Select value={value} onValueChange={(val) => handleCustomFieldChange(field.id, val)}>
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {field.options?.map((option) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {error && <p className="text-sm text-destructive mt-1">{error}</p>}
                                </div>
                              )

                            case "checkbox":
                              return (
                                <div key={field.id} className="flex items-center space-x-2 mt-4">
                                  <Checkbox
                                    id={field.id}
                                    checked={value || false}
                                    onCheckedChange={(checked) => handleCustomFieldChange(field.id, checked)}
                                  />
                                  <Label htmlFor={field.id} className="cursor-pointer">
                                    {field.name}
                                  </Label>
                                  {error && <p className="text-sm text-destructive mt-1">{error}</p>}
                                </div>
                              )

                            default:
                              return null
                          }
                        })}
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
