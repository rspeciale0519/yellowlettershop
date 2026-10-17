/** Supported checkout formats. Larger postcards require an explicit admin rate. */
export const MAIL_PIECE_FORMATS = ['postcard_4x6', 'postcard_5x7', 'postcard_6x9', 'postcard_6x11', 'letter_8_5x11', 'letter_folded'] as const
export type MailPieceFormat = typeof MAIL_PIECE_FORMATS[number]
