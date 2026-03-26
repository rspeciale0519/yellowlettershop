import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'

interface RouteParams {
  params: { id: string }
}

export const POST = withAuth(async (
  request: NextRequest,
  { userId }: { userId: string },
  { params }: RouteParams
) => {
  try {
    const supabase = createClient()

    // Verify the contact card exists and belongs to the user
    const { data: contactCard, error: verifyError } = await supabase
      .from('contact_cards')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', userId)
      .eq('is_soft_deleted', false)
      .single()

    if (verifyError || !contactCard) {
      return NextResponse.json({ error: 'Contact card not found' }, { status: 404 })
    }

    // Remove default from all other cards first
    const { error: removeDefaultError } = await supabase
      .from('contact_cards')
      .update({ is_default: false })
      .eq('user_id', userId)
      .neq('id', params.id)

    if (removeDefaultError) {
      console.error('Error removing default from other cards:', removeDefaultError)
      return NextResponse.json({ error: 'Failed to update default status' }, { status: 500 })
    }

    // Set this card as default
    const { data: updatedCard, error: setDefaultError } = await supabase
      .from('contact_cards')
      .update({ 
        is_default: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (setDefaultError) {
      console.error('Error setting default contact card:', setDefaultError)
      return NextResponse.json({ error: 'Failed to set default contact card' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Default contact card updated successfully',
      contactCard: updatedCard 
    })
  } catch (error) {
    console.error('Set default contact card API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})