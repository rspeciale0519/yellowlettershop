import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'

const PreviewRequestSchema = z.object({
  designState: z.any().optional(),
  contactCard: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    fullName: z.string().optional(),
    address: z.object({
      address_line_1: z.string().optional(),
      address_line_2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip_code: z.string().optional()
    }).optional(),
    email: z.string().optional(),
    phone: z.string().optional()
  }).optional(),
  sampleData: z.record(z.unknown()).optional()
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const validatedData = PreviewRequestSchema.parse(body)
    
    const supabase = createClient()
    
    // Generate preview images based on design state
    const previewId = crypto.randomUUID()
    
    // Simulate preview generation process
    // In a real implementation, this would:
    // 1. Render the design with live data
    // 2. Generate PDF/image previews
    // 3. Store them in Supabase Storage
    // 4. Return URLs to the generated previews
    
    const designPreview = {
      id: previewId,
      userId,
      designState: validatedData.designState,
      contactCardData: validatedData.contactCard,
      sampleData: validatedData.sampleData,
      createdAt: new Date().toISOString()
    }
    
    // Store preview metadata in database
    const { data: savedPreview, error } = await supabase
      .from('design_previews')
      .insert(designPreview)
      .select()
      .single()
    
    if (error) {
      console.error('Error saving design preview:', error)
      throw new Error('Failed to save design preview')
    }
    
    // Simulate preview file generation and upload to storage
    await generatePreviewFiles(previewId, validatedData, supabase)
    
    // Return preview URLs
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'
    
    return NextResponse.json({
      previewId,
      liveDataUrl: `${baseUrl}/storage/v1/object/public/design-previews/${previewId}/live-data.pdf`,
      variableUrl: `${baseUrl}/storage/v1/object/public/design-previews/${previewId}/variable.pdf`,
      thumbnailUrl: `${baseUrl}/storage/v1/object/public/design-previews/${previewId}/thumbnail.jpg`,
      generatedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Design preview generation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Preview generation failed' },
      { status: 500 }
    )
  }
})

// Simulate preview file generation
async function generatePreviewFiles(previewId: string, data: any, supabase: any) {
  try {
    // In a real implementation, this would:
    // 1. Use a PDF generation library (like Puppeteer or jsPDF)
    // 2. Render the design with actual data vs variables
    // 3. Upload the generated files to Supabase Storage
    
    // For now, we'll create placeholder files
    const liveDataPdf = generateMockPDF('Live Data Preview', data.contactCard)
    const variablePdf = generateMockPDF('Variable Template', { placeholder: 'variables' })
    const thumbnail = generateMockThumbnail()
    
    // Upload files to storage (simulated)
    const uploads = [
      {
        path: `design-previews/${previewId}/live-data.pdf`,
        file: liveDataPdf,
        contentType: 'application/pdf'
      },
      {
        path: `design-previews/${previewId}/variable.pdf`, 
        file: variablePdf,
        contentType: 'application/pdf'
      },
      {
        path: `design-previews/${previewId}/thumbnail.jpg`,
        file: thumbnail,
        contentType: 'image/jpeg'
      }
    ]
    
    for (const upload of uploads) {
      const { error } = await supabase.storage
        .from('design-previews')
        .upload(upload.path, upload.file, {
          contentType: upload.contentType,
          upsert: true
        })
      
      if (error) {
        console.error(`Error uploading ${upload.path}:`, error)
      }
    }
    
    console.log(`Preview files generated for ${previewId}`)
    
  } catch (error) {
    console.error('Error generating preview files:', error)
    throw error
  }
}

// Mock PDF generation (replace with real PDF generation)
function generateMockPDF(title: string, data: any): Blob {
  const content = `
    %PDF-1.4
    1 0 obj
    << /Type /Catalog /Pages 2 0 R >>
    endobj
    2 0 obj
    << /Type /Pages /Kids [3 0 R] /Count 1 >>
    endobj
    3 0 obj
    << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
    endobj
    xref
    0 4
    0000000000 65535 f 
    0000000010 00000 n 
    0000000079 00000 n 
    0000000173 00000 n 
    trailer
    << /Size 4 /Root 1 0 R >>
    startxref
    253
    %%EOF
  `
  
  return new Blob([content], { type: 'application/pdf' })
}

// Mock thumbnail generation (replace with real image generation)
function generateMockThumbnail(): Blob {
  // Create a simple base64 encoded 1x1 pixel JPEG
  const base64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=='
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new Blob([bytes], { type: 'image/jpeg' })
}