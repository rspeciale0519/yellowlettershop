# Tag Category Management

## Overview

Tag categories are managed centrally through the configuration file located at:
`/lib/constants/tag-categories.ts`

## How to Add/Edit/Delete Categories

### Adding a New Category

1. Open `/lib/constants/tag-categories.ts`
2. Add your new category to the `TAG_CATEGORIES` array:
   ```typescript
   export const TAG_CATEGORIES = [
     'system',
     'list_management',
     'demographics', 
     'geography',
     'campaign',
     'custom',
     'your_new_category'  // Add here
   ] as const
   ```

3. Add a display name in `CATEGORY_DISPLAY_NAMES`:
   ```typescript
   export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
     // ... existing entries
     'your_new_category': 'Your New Category'
   }
   ```

4. Add a description in `CATEGORY_DESCRIPTIONS`:
   ```typescript
   export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
     // ... existing entries
     'your_new_category': 'Description of your new category'
   }
   ```

### Editing a Category

1. To change the display name: Update `CATEGORY_DISPLAY_NAMES`
2. To change the description: Update `CATEGORY_DESCRIPTIONS` 
3. To change the internal name: Update all three objects (`TAG_CATEGORIES`, `CATEGORY_DISPLAY_NAMES`, `CATEGORY_DESCRIPTIONS`)

### Deleting a Category

1. Remove the category from `TAG_CATEGORIES` array
2. Remove the entry from `CATEGORY_DISPLAY_NAMES`
3. Remove the entry from `CATEGORY_DESCRIPTIONS`

**⚠️ Warning**: Deleting a category that's already in use by existing tags may cause issues. Consider adding migration logic or data cleanup if needed.

## Where Categories Are Used

Categories automatically appear in:
- **Tag Creation/Edit Forms** - Dropdown selection
- **Tag Management Page** - Filter dropdown and tag card displays
- **Media Library Tag Selector** - Category group headers
- **Bulk Tag Operations** - Category organization in tag selection

## Current Categories

| Internal Name | Display Name | Description |
|---------------|--------------|-------------|
| `system` | System | Auto-generated tags by the system |
| `list_management` | List Management | Tags for organizing mailing lists |
| `demographics` | Demographics | Age, income, gender, and demographic data |
| `geography` | Geography | Location-based and geographic tags |
| `campaign` | Campaign | Campaign-specific and marketing tags |
| `custom` | Custom | User-defined custom categories |

## Technical Notes

- Changes take effect immediately after saving the file
- No database changes required - categories are code-based
- All components automatically use the centralized configuration
- Type safety is maintained through TypeScript `as const` assertion