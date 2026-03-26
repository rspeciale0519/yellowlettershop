import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'

interface RouteParams {
  params: {
    templateId: string
  }
}

export const GET = withAuth(async (req: NextRequest, { userId }, { params }: RouteParams) => {
  try {
    const { templateId } = params
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = createClient()
    
    // Fetch template data
    const { data: template, error } = await supabase
      .from('mail_templates')
      .select(`
        id,
        name,
        description,
        category,
        dimensions,
        design_state,
        preview_url,
        thumbnail_url,
        variables_used,
        is_premium,
        created_at,
        updated_at
      `)
      .eq('id', templateId)
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.error('Error fetching template:', error)
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    // Check if user has access to premium templates
    if (template.is_premium) {
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()
      
      if (subError || !subscription || subscription.tier === 'free') {
        return NextResponse.json(
          { error: 'Premium template requires subscription' },
          { status: 403 }
        )
      }
    }
    
    // Return template data
    return NextResponse.json({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      dimensions: template.dimensions,
      designState: template.design_state,
      previewUrl: template.preview_url,
      thumbnailUrl: template.thumbnail_url,
      variablesUsed: template.variables_used || [],
      isPremium: template.is_premium,
      createdAt: template.created_at,
      updatedAt: template.updated_at
    })
    
  } catch (error) {
    console.error('Template fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Template fetch failed' },
      { status: 500 }
    )
  }
})

// Update template (for admin/template creators)
export const PUT = withAuth(async (req: NextRequest, { userId }, { params }: RouteParams) => {
  try {
    const { templateId } = params
    const body = await req.json()
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = createClient()
    
    // Check if user has permission to edit this template
    const { data: template, error: fetchError } = await supabase
      .from('mail_templates')
      .select('id, created_by')
      .eq('id', templateId)
      .single()
    
    if (fetchError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    // Only allow template creator or admin to edit
    if (template.created_by !== userId) {
      // Check if user is admin
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .single()
      
      if (!userProfile || userProfile.role !== 'admin') {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }
    
    // Update template
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('mail_templates')
      .update({
        name: body.name,
        description: body.description,
        category: body.category,
        design_state: body.designState,
        variables_used: body.variablesUsed,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating template:', updateError)
      throw new Error('Failed to update template')
    }
    
    return NextResponse.json({
      id: updatedTemplate.id,
      message: 'Template updated successfully',
      updatedAt: updatedTemplate.updated_at
    })
    
  } catch (error) {
    console.error('Template update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Template update failed' },
      { status: 500 }
    )
  }
})