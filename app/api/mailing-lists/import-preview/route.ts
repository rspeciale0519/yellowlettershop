import { NextRequest, NextResponse } from 'next/server'
import { generateImportPreview } from '@/lib/validation/import-preview'

export async function POST(request: NextRequest) {
  try {
    const { headers, sampleRows, columnMappings, options = {} } = await request.json()
    
    if (!headers || !sampleRows || !columnMappings) {
      return NextResponse.json(
        { error: 'Missing required parameters: headers, sampleRows, and columnMappings' },
        { status: 400 }
      )
    }

    // Generate comprehensive import preview
    const preview = await generateImportPreview(
      headers,
      sampleRows,
      columnMappings,
      {
        maxPreviewRecords: options.maxPreviewRecords || 50,
        includeValidationDetails: options.includeValidationDetails !== false,
        checkDuplicates: options.checkDuplicates !== false,
        requireEmail: options.requireEmail || false,
        requirePhone: options.requirePhone || false,
        requireAddress: options.requireAddress || false
      }
    )

    return NextResponse.json({
      success: true,
      preview
    })

  } catch (error) {
    console.error('Import preview error:', error)
    return NextResponse.json(
      { error: 'Failed to generate import preview' },
      { status: 500 }
    )
  }
}
