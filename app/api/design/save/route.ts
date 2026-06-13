import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'

const SaveDesignSchema = z.object({
  designState: z.object({
    designId: z.string().uuid().optional(),
    templateId: z.string().min(1),
    templateName: z.string().min(1),
    orientation: z.enum(['portrait', 'landscape']),
    formatId: z.string().optional(),
    pages: z.record(z.enum(['front', 'back']), z.array(z.object({}).passthrough())),
    backgrounds: z
      .record(
        z.enum(['front', 'back']),
        z
          .object({
            color: z.string().optional(),
            image: z
              .object({
                assetId: z.string().optional(),
                src: z.string(),
                sourceUrl: z.string().optional(),
                fit: z.enum(['cover', 'contain']),
                opacity: z.number().optional(),
              })
              .optional(),
          })
          .strict(),
      )
      .optional(),
    updatedAt: z.string()
  }).passthrough(),
  orderId: z.string().uuid().optional(),
  templateId: z.string().optional(),
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
    
    // Create design record. The consolidated schema uses `saved_designs`
    // (design_data jsonb); the order linkage is via orders.design_id below.
    const designData = {
      user_id: userId,
      name: validatedData.name || `Design ${new Date().toLocaleString()}`,
      description: validatedData.description || null,
      design_data: validatedData.designState,
      is_template: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: savedDesign, error } = await supabase
      .from('saved_designs')
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
function extractVariablesFromDesign(designState: z.infer<typeof SaveDesignSchema>['designState']): string[] {
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
      .from('saved_designs')
      .update({
        design_data: updateData.designState,
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
