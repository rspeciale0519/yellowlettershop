import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CategoryUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sort_order: z.number().min(0).max(999).optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    const categoryId = params.id
    const body = await request.json()

    // Validate input
    const updates = CategoryUpdateSchema.parse(body)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if category exists
    const { data: existingCategory, error: fetchError } = await supabase
      .from('tag_categories')
      .select('*')
      .eq('id', categoryId)
      .single()

    if (fetchError || !existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Prevent editing system categories
    if (existingCategory.is_system) {
      return NextResponse.json({ error: 'Cannot modify system categories' }, { status: 400 })
    }

    // Check if new name conflicts with existing categories
    if (updates.name && updates.name !== existingCategory.name) {
      const { data: existing } = await supabase
        .from('tag_categories')
        .select('id')
        .eq('name', updates.name)
        .single()

      if (existing) {
        return NextResponse.json({ error: 'Category name already exists' }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description || null
    if (updates.color !== undefined) updateData.color = updates.color
    if (updates.icon !== undefined) updateData.icon = updates.icon
    if (updates.sort_order !== undefined) updateData.sort_order = updates.sort_order

    // Update the category
    const { data: category, error } = await supabase
      .from('tag_categories')
      .update(updateData)
      .eq('id', categoryId)
      .select()
      .single()

    if (error) {
      console.error('Error updating tag category:', error)
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in tag-categories PATCH API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    const categoryId = params.id

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if category exists
    const { data: existingCategory, error: fetchError } = await supabase
      .from('tag_categories')
      .select('*')
      .eq('id', categoryId)
      .single()

    if (fetchError || !existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Prevent deletion of system categories
    if (existingCategory.is_system) {
      return NextResponse.json({ error: 'Cannot delete system categories' }, { status: 400 })
    }

    // Check if category is in use by any tags
    const { data: tagsUsingCategory, error: tagsError } = await supabase
      .from('tags')
      .select('id')
      .eq('category', existingCategory.name.toLowerCase().replace(/\s+/g, '_'))
      .limit(1)

    if (tagsError) {
      console.error('Error checking tag usage:', tagsError)
      return NextResponse.json({ error: 'Failed to check category usage' }, { status: 500 })
    }

    if (tagsUsingCategory && tagsUsingCategory.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category that is in use by tags' 
      }, { status: 400 })
    }

    // Delete the category
    const { error } = await supabase
      .from('tag_categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('Error deleting tag category:', error)
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in tag-categories DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}