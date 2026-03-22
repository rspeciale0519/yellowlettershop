import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'

const SaveDesignSchema = z.object({
  designState: z.any(),
  orderId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  name: z.string().optional(),
  description: z.string().optional()
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const validatedData = SaveDesignSchema.parse(body)
    
    const supabase = createClient()
    
    // Extract variables from design state
    const variablesUsed = extractVariablesFromDesign(validatedData.designState)
    
    // Create design record
    const designData = {
      user_id: userId,
      order_id: validatedData.orderId || null,
      template_id: validatedData.templateId || null,
      name: validatedData.name || `Design ${new Date().toLocaleString()}`,
      description: validatedData.description || null,
      design_state: validatedData.designState,
      variables_used: variablesUsed,
      is_template: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: savedDesign, error } = await supabase
      .from('user_designs')
      .insert(designData)
      .select()
      .single()
    
    if (error) {
      console.error('Error saving design:', error)
      throw new Error('Failed to save design')
    }
    
    // If this is part of an order workflow, update the order
    if (validatedData.orderId) {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          design_id: savedDesign.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', validatedData.orderId)
        .eq('user_id', userId)
      
      if (orderError) {
        console.error('Error updating order with design:', orderError)
        // Don't throw here - design was saved successfully
      }
    }
    
    return NextResponse.json({
      designId: savedDesign.id,
      variablesUsed,
      savedAt: savedDesign.created_at,
      message: 'Design saved successfully'
    })
    
  } catch (error) {
    console.error('Design save error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Design save failed' },
      { status: 500 }
    )
  }
})

// Extract variable placeholders from design state
function extractVariablesFromDesign(designState: any): string[] {
  const variables = new Set<string>()
  
  // Convert design state to JSON string to search for variable patterns
  const designJson = JSON.stringify(designState)
  
  // Pattern to match {{variable_name}} placeholders
  const variablePattern = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g
  
  let match
  while ((match = variablePattern.exec(designJson)) !== null) {
    variables.add(match[1])
  }
  
  return Array.from(variables).sort()
}

// Update an existing design
export const PUT = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const updateData = SaveDesignSchema.extend({
      designId: z.string().uuid()
    }).parse(body)
    
    const supabase = createClient()
    
    // Extract variables from design state
    const variablesUsed = extractVariablesFromDesign(updateData.designState)
    
    // Update design record
    const { data: updatedDesign, error } = await supabase
      .from('user_designs')
      .update({
        design_state: updateData.designState,
        variables_used: variablesUsed,
        name: updateData.name,
        description: updateData.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', updateData.designId)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating design:', error)
      throw new Error('Failed to update design')
    }
    
    if (!updatedDesign) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      designId: updatedDesign.id,
      variablesUsed,
      updatedAt: updatedDesign.updated_at,
      message: 'Design updated successfully'
    })
    
  } catch (error) {
    console.error('Design update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Design update failed' },
      { status: 500 }
    )
  }
})