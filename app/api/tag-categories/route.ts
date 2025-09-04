import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CategoryCreateSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sort_order: z.number().min(0).max(999).optional()
})

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all tag categories (they are visible to all authenticated users)
    const { data: categories, error } = await supabase
      .from('tag_categories')
      .select('*')
      .order('sort_order')
      .order('name')

    if (error) {
      console.error('Error fetching tag categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error in tag-categories API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const body = await request.json()

    // Validate input
    const categoryData = CategoryCreateSchema.parse(body)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if category name already exists
    const { data: existing } = await supabase
      .from('tag_categories')
      .select('id')
      .eq('name', categoryData.name)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 400 })
    }

    // Get next sort order if not specified
    let sortOrder = categoryData.sort_order
    if (!sortOrder) {
      const { data: lastCategory } = await supabase
        .from('tag_categories')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

      sortOrder = (lastCategory?.sort_order || 0) + 1
    }

    // Prepare category data for insert
    const insertData = {
      name: categoryData.name,
      description: categoryData.description || null,
      color: categoryData.color || '#6B7280',
      icon: categoryData.icon || '🏷️',
      is_system: false,
      sort_order: sortOrder
    }

    // Insert the category
    const { data: category, error } = await supabase
      .from('tag_categories')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('Error creating tag category:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in tag-categories POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}