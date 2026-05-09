import type { CanvasSize, DesignerDocument, DesignerOrientation } from "@/types/designer"

export const DESIGNER_STORAGE_KEY = "yls.design.customize.v1"

export const CANVAS_SIZES: Record<DesignerOrientation, CanvasSize> = {
  portrait: { width: 862, height: 1112 },
  landscape: { width: 1112, height: 862 },
}

export const DESIGN_TEMPLATES = [
  {
    id: "real-estate-flyer",
    name: "Real Estate Flyer",
    pages: {
      front: [
        { id: "front-logo", name: "Company Logo", type: "image", src: "placeholder:Company Logo", x: 50, y: 30, width: 300, height: 120, zIndex: 1 },
        { id: "front-headline", name: "Headline", type: "text", content: "HEADLINE", x: 110, y: 150, width: 280, height: 48, fontSize: 36, fontWeight: "bold", zIndex: 2 },
        { id: "front-body", name: "Body Text", type: "text", content: "Your Text Here", x: 125, y: 205, width: 220, height: 28, fontSize: 16, fontWeight: "normal", zIndex: 3 },
        { id: "front-company", name: "Company Name", type: "text", content: "COMPANY NAME", x: 110, y: 310, width: 230, height: 28, fontSize: 18, fontWeight: "bold", zIndex: 4 },
      ],
      back: [
        { id: "back-headline", name: "Back Headline", type: "text", content: "Ready to talk?", x: 90, y: 140, width: 260, height: 40, fontSize: 30, fontWeight: "bold", zIndex: 1 },
        { id: "back-body", name: "Back Body", type: "text", content: "Call us today to learn more.", x: 90, y: 205, width: 300, height: 28, fontSize: 16, fontWeight: "normal", zIndex: 2 },
      ],
    },
  },
  {
    id: "yellow-letter",
    name: "Yellow Letter",
    pages: {
      front: [
        { id: "letter-greeting", name: "Greeting", type: "text", content: "Dear {{first_name}},", x: 90, y: 115, width: 260, height: 34, fontSize: 24, fontWeight: "normal", zIndex: 1 },
        { id: "letter-body", name: "Letter Body", type: "text", content: "I am interested in your property at {{address_line_1}}.", x: 90, y: 180, width: 520, height: 70, fontSize: 18, fontWeight: "normal", zIndex: 2 },
        { id: "letter-signature", name: "Signature", type: "text", content: "{{sender_first}} {{sender_last}}", x: 90, y: 330, width: 260, height: 32, fontSize: 22, fontWeight: "bold", zIndex: 3 },
      ],
      back: [
        { id: "letter-return", name: "Return Company", type: "text", content: "{{sender_company}}", x: 90, y: 115, width: 260, height: 32, fontSize: 18, fontWeight: "bold", zIndex: 1 },
        { id: "letter-phone", name: "Return Phone", type: "text", content: "{{sender_phone}}", x: 90, y: 155, width: 220, height: 28, fontSize: 16, fontWeight: "normal", zIndex: 2 },
      ],
    },
  },
  {
    id: "postcard-offer",
    name: "Postcard Offer",
    pages: {
      front: [
        { id: "offer-title", name: "Offer Title", type: "text", content: "SPECIAL OFFER", x: 90, y: 110, width: 340, height: 48, fontSize: 36, fontWeight: "bold", zIndex: 1 },
        { id: "offer-image", name: "Offer Image", type: "image", src: "placeholder:Image Area", x: 90, y: 190, width: 420, height: 260, zIndex: 2 },
        { id: "offer-cta", name: "Call To Action", type: "text", content: "Call {{sender_phone}}", x: 90, y: 500, width: 260, height: 36, fontSize: 22, fontWeight: "bold", zIndex: 3 },
      ],
      back: [
        { id: "offer-message", name: "Offer Message", type: "text", content: "Hi {{first_name}}, this message was made for you.", x: 90, y: 120, width: 440, height: 48, fontSize: 20, fontWeight: "normal", zIndex: 1 },
      ],
    },
  },
] as const

export function createDesignerDocument(templateId = DESIGN_TEMPLATES[0].id): DesignerDocument {
  const template = DESIGN_TEMPLATES.find((item) => item.id === templateId) ?? DESIGN_TEMPLATES[0]
  return {
    templateId: template.id,
    templateName: template.name,
    orientation: "portrait",
    pages: {
      front: template.pages.front.map((element) => ({ ...element })),
      back: template.pages.back.map((element) => ({ ...element })),
    },
    updatedAt: new Date().toISOString(),
  }
}
