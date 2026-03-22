import { createClient } from '@/utils/supabase/client'

interface CreateTagParams {
  name: string
  color?: string
  category?: string
  description?: string
}

/**
 * Automatically creates a tag in the Tag Manager system if it doesn't exist
 * This ensures that tags created during file operations are available system-wide
 */
export async function ensureTagExists(tagName: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('User not authenticated for tag creation')
      return false
    }

    // Check if tag already exists
    const existingTagsResponse = await fetch(`/api/tags?userId=${user.id}`)
    if (existingTagsResponse.ok) {
      const { tags } = await existingTagsResponse.json()
      const tagExists = tags.some((tag: any) =>
        tag.name.toLowerCase() === tagName.toLowerCase()
      )

      if (tagExists) {
        return true // Tag already exists
      }
    }

    // Create new tag with default properties
    const newTag: CreateTagParams = {
      name: tagName,
      category: 'custom', // Default category for media library tags
      color: generateDefaultTagColor(tagName),
      description: `Auto-created tag for media files`
    }

    const createResponse = await fetch('/api/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newTag.name,
        category: newTag.category,
        color: newTag.color,
        description: newTag.description,
        visibility: 'private',
        sort_order: 100, // Default sort order for auto-created tags
        is_system: false
      })
    })

    if (createResponse.ok) {
      console.log(`Auto-created tag: ${tagName}`)
      return true
    } else {
      console.error('Failed to create tag:', await createResponse.text())
      return false
    }
  } catch (error) {
    console.error('Error ensuring tag exists:', error)
    return false
  }
}

/**
 * Ensures multiple tags exist in the Tag Manager system
 */
export async function ensureTagsExist(tagNames: string[]): Promise<boolean> {
  const results = await Promise.all(
    tagNames.map(tagName => ensureTagExists(tagName.trim()))
  )

  return results.every(result => result === true)
}

/**
 * Generates a default color for a tag based on its name
 * Uses a simple hash to ensure consistent colors for the same tag name
 */
function generateDefaultTagColor(tagName: string): string {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6366F1'  // Indigo
  ]

  // Simple hash function based on tag name
  let hash = 0
  for (let i = 0; i < tagName.length; i++) {
    const char = tagName.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  return colors[Math.abs(hash) % colors.length]
}