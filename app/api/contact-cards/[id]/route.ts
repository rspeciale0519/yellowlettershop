import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'

const ContactCardUpdateSchema = z.object({
  name: z.string().min(1, 'Display name is required').optional(),
  company: z.string().optional(),
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  street_address: z.string().min(1, 'Street address is required').optional(),
  suite_unit_apt: z.string().optional(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().min(2, 'State is required').max(2, 'State must be 2 characters').optional(),
  zip_code: z.string().min(5, 'ZIP code must be at least 5 digits').optional(),
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().min(10, 'Phone number is required').optional(),
  is_default: z.boolean().optional()
})

interface RouteParams {
  params: { id: string }
}

export const GET = withAuth(async (
  request: NextRequest,
  { userId }: { userId: string },
  { params }: RouteParams
) => {
  try {
    const supabase = createClient()

    // Get specific contact card
    const { data: contactCard, error } = await supabase
      .from('contact_cards')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .eq('is_soft_deleted', false)
      .single()

    if (error) {
      console.error('Error fetching contact card:', error)
      return NextResponse.json({ error: 'Contact card not found' }, { status: 404 })
    }

    return NextResponse.json(contactCard)
  } catch (error) {
    console.error('Contact card API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const PUT = withAuth(async (
  request: NextRequest,
  { userId }: { userId: string },
  { params }: RouteParams
) => {
  try {
    const supabase = createClient()

    // Parse and validate request body
    const body = await request.json()
    const validatedData = ContactCardUpdateSchema.parse(body)

    // If setting as default, remove default from other cards first
    if (validatedData.is_default) {
      await supabase
        .from('contact_cards')
        .update({ is_default: false })
        .eq('user_id', userId)
        .neq('id', params.id)
    }

    // Update the contact card
    const { data: contactCard, error } = await supabase
      .from('contact_cards')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating contact card:', error)
      return NextResponse.json({ error: 'Failed to update contact card' }, { status: 500 })
    }

    return NextResponse.json(contactCard)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    
    console.error('Contact card API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const DELETE = withAuth(async (
  request: NextRequest,
  { userId }: { userId: string },
  { params }: RouteParams
) => {
  try {
    const supabase = createClient()

    // Check if this is the user's last contact card
    const { data: cardCount, error: countError } = await supabase
      .from('contact_cards')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_soft_deleted', false)

    if (countError) {
      console.error('Error checking contact card count:', countError)
      return NextResponse.json({ error: 'Failed to validate deletion' }, { status: 500 })
    }

    if (cardCount && cardCount.length <= 1) {
      return NextResponse.json({ 
        error: 'Cannot delete the last contact card. At least one contact card is required.' 
      }, { status: 400 })
    }

    // Soft delete the contact card
    const { error } = await supabase
      .from('contact_cards')
      .update({
        is_soft_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting contact card:', error)
      return NextResponse.json({ error: 'Failed to delete contact card' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Contact card deleted successfully' })
  } catch (error) {
    console.error('Contact card API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})