export interface Template {
  id: string
  name: string
  description: string
  category: string
  type: "letter" | "postcard" | "envelope"
  previewImage: string
  tags: string[]
  popularity: number
  createdAt: string
  isPremium: boolean
}

export interface TemplateSubcategory {
  id: string
  name: string
  templateCount: number
}

export interface TemplateCategory {
  id: string
  name: string
  templateCount: number
  subcategories?: TemplateSubcategory[]
}

export interface TemplatesData {
  categories: TemplateCategory[]
  templates: Template[]
}

export const templatesData: TemplatesData = {
  categories: [
    {
      id: "real-estate",
      name: "Real Estate",
      templateCount: 24,
      subcategories: [
        { id: "listings", name: "New Listings", templateCount: 8 },
        { id: "sold", name: "Just Sold", templateCount: 6 },
        { id: "market-updates", name: "Market Updates", templateCount: 5 },
        { id: "open-house", name: "Open House", templateCount: 5 },
      ],
    },
    {
      id: "business",
      name: "Business",
      templateCount: 18,
      subcategories: [
        { id: "promotions", name: "Promotions", templateCount: 7 },
        { id: "announcements", name: "Announcements", templateCount: 6 },
        { id: "thank-you", name: "Thank You", templateCount: 5 },
      ],
    },
    {
      id: "seasonal",
      name: "Seasonal",
      templateCount: 16,
      subcategories: [
        { id: "holidays", name: "Holidays", templateCount: 8 },
        { id: "spring", name: "Spring", templateCount: 4 },
        { id: "summer", name: "Summer", templateCount: 4 },
      ],
    },
    {
      id: "healthcare",
      name: "Healthcare",
      templateCount: 12,
      subcategories: [
        { id: "appointments", name: "Appointments", templateCount: 6 },
        { id: "wellness", name: "Wellness", templateCount: 6 },
      ],
    },
    {
      id: "automotive",
      name: "Automotive",
      templateCount: 10,
      subcategories: [
        { id: "service", name: "Service Reminders", templateCount: 5 },
        { id: "sales", name: "Sales Events", templateCount: 5 },
      ],
    },
  ],
  templates: [
    // Real Estate Templates
    {
      id: "re-001",
      name: "Modern Listing Announcement",
      description: "Clean, professional design perfect for announcing new property listings",
      category: "listings",
      type: "postcard",
      previewImage: "/placeholder.svg?height=300&width=400&text=Modern+Listing",
      tags: ["modern", "clean", "professional", "listing"],
      popularity: 95,
      createdAt: "2024-01-15",
      isPremium: false,
    },
    {
      id: "re-002",
      name: "Luxury Property Showcase",
      description: "Elegant template designed for high-end property marketing",
      category: "listings",
      type: "letter",
      previewImage: "/placeholder.svg?height=300&width=400&text=Luxury+Property",
      tags: ["luxury", "elegant", "high-end", "premium"],
      popularity: 88,
      createdAt: "2024-01-10",
      isPremium: true,
    },
    {
      id: "re-003",
      name: "Just Sold Success",
      description: "Celebrate your recent sales with this eye-catching design",
      category: "sold",
      type: "postcard",
      previewImage: "/placeholder.svg?height=300&width=400&text=Just+Sold",
      tags: ["celebration", "success", "sold", "achievement"],
      popularity: 92,
      createdAt: "2024-01-08",
      isPremium: false,
    },
    {
      id: "re-004",
      name: "Market Report Newsletter",
      description: "Professional template for sharing market insights and trends",
      category: "market-updates",
      type: "letter",
      previewImage: "/placeholder.svg?height=300&width=400&text=Market+Report",
      tags: ["newsletter", "market", "insights", "professional"],
      popularity: 76,
      createdAt: "2024-01-05",
      isPremium: false,
    },
    {
      id: "re-005",
      name: "Open House Invitation",
      description: "Inviting design to promote your upcoming open house events",
      category: "open-house",
      type: "postcard",
      previewImage: "/placeholder.svg?height=300&width=400&text=Open+House",
      tags: ["invitation", "open house", "event", "welcoming"],
      popularity: 84,
      createdAt: "2024-01-03",
      isPremium: false,
    },

    // Business Templates
    {
      id: "biz-001",
      name: "Grand Opening Special",
      description: "Generate excitement for your business launch with this vibrant template",
      category: "promotions",
      type: "postcard",
      previewImage: "/placeholder.svg?height=300&width=400&text=Grand+Opening",
      tags: ["grand opening", "launch", "special", "vibrant"],
      popularity: 89,
      createdAt: "2024-01-12",
      isPremium: false,
    },
    {
      id: "biz-002",
      name: "Customer Appreciation",
      description: "Show gratitude to your loyal customers with this heartfelt design",
      category: "thank-you",
      type: "letter",
      previewImage: "/placeholder.svg?height=300&width=400&text=Thank+You",
      tags: ["appreciation", "gratitude", "loyal", "heartfelt"],
      popularity: 91,
      createdAt: "2024-01-09",
      isPremium: false,
    },
    {
      id: "biz-003",
      name: "New Service Announcement",
      description: "Professional template to introduce new services to your customers",
      category: "announcements",
      type: "letter",
      previewImage: "/placeholder.svg?height=300&width=400&text=New+Service",
      tags: ["announcement", "new service", "professional", "introduction"],
      popularity: 78,
      createdAt: "2024-01-07",
      isPremium: false,
    },

    // Seasonal Templates
    {
      id: "sea-001",
      name: "Holiday Greetings",
      description: "Warm and festive template perfect for holiday communications",
      category: "holidays",
      type: "postcard",
      previewImage: "/placeholder.svg?height=300&width=400&text=Holiday+Greetings",
      tags: ["holiday", "festive", "warm", "greetings"],
      popularity: 94,
      createdAt: "2023-12-01",
      isPremium: false,
    },
    {
      id: "sea-002",
      name: "Spring Cleaning Special",
      description: "Fresh and clean design for spring promotional campaigns",
      category: "spring",
      type: "postcard",
      previewImage: "/placeholder.svg?height=300&width=400&text=Spring+Cleaning",
      tags: ["spring", "cleaning", "fresh", "promotional"],
      popularity: 72,
      createdAt: "2024-03-01",
      isPremium: false,
    },

    // Healthcare Templates
    {
      id: "hc-001",
      name: "Appointment Reminder",
      description: "Professional and caring template for appointment reminders",
      category: "appointments",
      type: "letter",
      previewImage: "/placeholder.svg?height=300&width=400&text=Appointment+Reminder",
      tags: ["appointment", "reminder", "professional", "caring"],
      popularity: 85,
      createdAt: "2024-01-14",
      isPremium: false,
    },
    {
      id: "hc-002",
      name: "Wellness Newsletter",
      description: "Informative template for sharing health and wellness tips",
      category: "wellness",
      type: "letter",
      previewImage: "/placeholder.svg?height=300&width=400&text=Wellness+Newsletter",
      tags: ["wellness", "health", "newsletter", "informative"],
      popularity: 79,
      createdAt: "2024-01-11",
      isPremium: false,
    },

    // Automotive Templates
    {
      id: "auto-001",
      name: "Service Reminder Notice",
      description: "Professional template for vehicle service reminders",
      category: "service",
      type: "postcard",
      previewImage: "/placeholder.svg?height=300&width=400&text=Service+Reminder",
      tags: ["service", "reminder", "vehicle", "maintenance"],
      popularity: 81,
      createdAt: "2024-01-06",
      isPremium: false,
    },
    {
      id: "auto-002",
      name: "Sales Event Promotion",
      description: "Eye-catching design for automotive sales events and promotions",
      category: "sales",
      type: "postcard",
      previewImage: "/placeholder.svg?height=300&width=400&text=Sales+Event",
      tags: ["sales", "event", "promotion", "automotive"],
      popularity: 77,
      createdAt: "2024-01-04",
      isPremium: false,
    },
  ],
}
