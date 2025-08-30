import type { FormData } from "./types"

export const validateForm = (
  formData: FormData,
  listOption: "existing" | "new",
  selectedListId: string,
  newListName: string
): Record<string, string> => {
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

  return newErrors
}

export const initializeCustomFields = (customFieldDefinitions: any[]): Record<string, any> => {
  const initialValues: Record<string, any> = {}

  customFieldDefinitions.forEach((field) => {
    if (field.type === "checkbox") {
      initialValues[field.id] = false
    } else if (field.type === "select" && field.options) {
      initialValues[field.id] = field.options[0]
    } else {
      initialValues[field.id] = ""
    }
  })

  return initialValues
}
