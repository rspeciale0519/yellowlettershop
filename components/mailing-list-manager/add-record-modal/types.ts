// components/mailing-list-manager/add-record-modal/types.ts

export interface MailingListSummary {
  id: string
  name: string
  recordCount: number
}

export interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
}

export interface AddRecordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (newRecord: any) => void
  lists?: MailingListSummary[]
  onCreateNewList: (listName: string) => Promise<MailingListSummary>
}

export interface CustomField {
  id: string
  name: string
  type: "text" | "number" | "select" | "checkbox"
  options?: string[]
}

export const getCustomFieldsForList = (listName: string): CustomField[] => {
  if (!listName) return []

  const fields: CustomField[] = []

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
