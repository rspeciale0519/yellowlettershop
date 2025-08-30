export interface AddListModalProps<TNewList = unknown> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newList: TNewList) => void;
}

export interface ColumnMapping {
  fieldId: string; // predefined field id, "custom", "keep", or "ignore"
  customName?: string; // only used when fieldId is "custom"
  confidence?: number; // confidence score for automatic matching
}

export interface PredefinedField {
  id: string;
  label: string;
}

export interface ManualRecord {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  email?: string;
  phone?: string;
}

export const PREDEFINED_FIELDS: PredefinedField[] = [
  { id: 'firstName', label: 'First Name' },
  { id: 'lastName', label: 'Last Name' },
  { id: 'address', label: 'Address' },
  { id: 'city', label: 'City' },
  { id: 'state', label: 'State' },
  { id: 'zipCode', label: 'Zip Code' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
];
