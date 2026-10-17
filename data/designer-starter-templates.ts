import type { Template } from './templates-data'

/** Only real matching built-ins are editable; demo catalog artwork stays separate. */
export const designerStarterTemplates: Template[] = [
  ...(['white-notepad','yellow-notepad'] as const).map(id=>({
    id:`starter-${id}`,name:id==='white-notepad'?'White Notepad Letter':'Yellow Notepad Letter',description:'Write naturally in a guided text box aligned to the paper rules.',category:'editable-layouts',type:'letter' as const,previewImage:`/placeholder.svg?text=${id}`,tags:['editable','notepad','letter'],popularity:0,createdAt:'2026-10-17',isPremium:false,
    editor:{readiness:'ready' as const,designerTemplateId:id,formatId:'letter_8_5x11' as const,orientation:'portrait' as const},
  })),
  {
    id: 'starter-real-estate-flyer', name: 'Real Estate Flyer',
    description: 'Editable starting layout with a headline, company details, and image area.',
    category: 'editable-layouts', type: 'letter',
    previewImage: '/placeholder.svg?text=Real+Estate+Flyer',
    tags: ['editable', 'starter', 'real estate'], popularity: 0,
    createdAt: '2026-10-17', isPremium: false,
    editor: { readiness: 'ready', designerTemplateId: 'real-estate-flyer', formatId: 'letter_8_5x11', orientation: 'portrait' },
  },
  {
    id: 'starter-yellow-letter', name: 'Yellow Letter',
    description: 'Editable letter starting layout with greeting, message, and signature.',
    category: 'editable-layouts', type: 'letter',
    previewImage: '/placeholder.svg?text=Yellow+Letter',
    tags: ['editable', 'starter', 'letter'], popularity: 0,
    createdAt: '2026-10-17', isPremium: false,
    editor: { readiness: 'ready', designerTemplateId: 'yellow-letter', formatId: 'letter_8_5x11', orientation: 'portrait' },
  },
  {
    id: 'starter-postcard-offer', name: 'Postcard Offer',
    description: 'Editable postcard starting layout with an offer, image area, and call to action.',
    category: 'editable-layouts', type: 'postcard',
    previewImage: '/placeholder.svg?text=Postcard+Offer',
    tags: ['editable', 'starter', 'postcard'], popularity: 0,
    createdAt: '2026-10-17', isPremium: false,
    editor: { readiness: 'ready', designerTemplateId: 'postcard-offer', formatId: 'postcard_6x9', orientation: 'portrait' },
  },
]
