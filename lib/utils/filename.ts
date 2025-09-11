/**
 * Utility functions for filename sanitization and handling
 */

/**
 * Sanitizes a filename to be safe for storage and URLs
 * @param filename - The original filename
 * @returns Sanitized filename safe for storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace invalid characters for file systems and URLs
  return filename
    .trim()
    .toLowerCase()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove or replace special characters (keep only alphanumeric, hyphens, dots, underscores)
    .replace(/[^a-z0-9.\-_]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Ensure it doesn't start with a dot (hidden files)
    .replace(/^\.+/, '')
}

/**
 * Generates a storage-safe filename while preserving the extension
 * @param originalFilename - The original filename with extension
 * @param newDisplayName - The new display name (without extension)
 * @returns Object with sanitized filename and display name
 */
export function generateSafeFilename(originalFilename: string, newDisplayName: string): {
  sanitizedFilename: string
  displayName: string
  extension: string
} {
  // Extract extension from original filename
  const extensionMatch = originalFilename.match(/(\.[^.]+)$/)
  const extension = extensionMatch ? extensionMatch[1] : ''
  
  // Sanitize the new display name (without extension)
  const sanitizedBaseName = sanitizeFilename(newDisplayName)
  
  // Combine sanitized name with original extension
  const sanitizedFilename = sanitizedBaseName + extension
  
  // Create a clean display name (preserve user's formatting but clean)
  const displayName = newDisplayName.trim() + extension
  
  return {
    sanitizedFilename,
    displayName,
    extension
  }
}

/**
 * Validates if a filename is acceptable
 * @param filename - Filename to validate
 * @returns Error message if invalid, null if valid
 */
export function validateFilename(filename: string): string | null {
  if (!filename.trim()) {
    return 'Filename cannot be empty'
  }
  
  if (filename.length > 255) {
    return 'Filename is too long (max 255 characters)'
  }
  
  // Check for completely invalid characters that can't be sanitized
  const severelyInvalidChars = /[\x00-\x1F\x7F]/
  if (severelyInvalidChars.test(filename)) {
    return 'Filename contains invalid control characters'
  }
  
  // Check for reserved names (Windows)
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i
  if (reservedNames.test(filename)) {
    return 'Filename uses a reserved system name'
  }
  
  return null
}