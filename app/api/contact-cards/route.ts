import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'

const ContactCardSchema = z.object({
  name: z.string().min(1, 'Display name is required'),
  company: z.string().optional(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  street_address: z.string().min(1, 'Street address is required'),
  suite_unit_apt: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required').max(2, 'State must be 2 characters'),
  zip_code: z.string().min(5, 'ZIP code must be at least 5 digits'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Phone number is required'),
  is_default: z.boolean().default(false)
})

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get contact cards for the authenticated user (RLS will automatically filter by user)
    const { data: contactCards, error } = await supabase
      .from('contact_cards')
      .select('*')
      .eq('is_soft_deleted', false)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contact cards:', error)
      return NextResponse.json({ error: 'Failed to fetch contact cards' }, { status: 500 })
    }

    return NextResponse.json(contactCards || [])
  } catch (error) {
    console.error('Contact cards API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = ContactCardSchema.parse(body)

    // If setting as default, remove default from other cards first
    if (validatedData.is_default) {
      await supabase
        .from('contact_cards')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }

    // Create the contact card
    const { data: contactCard, error } = await supabase
      .from('contact_cards')
      .insert({
        ...validatedData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating contact card:', error)
      return NextResponse.json({ error: 'Failed to create contact card' }, { status: 500 })
    }

    return NextResponse.json(contactCard, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Contact cards API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}