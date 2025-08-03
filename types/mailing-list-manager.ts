export type MailingListRecord = {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  status: "active" | "do-not-mail" | "archived"
}
