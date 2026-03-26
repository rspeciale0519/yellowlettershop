import { NextRequest, NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'

export const dynamic = 'force-dynamic'

interface ParsedData {
  headers: string[]
  sampleData: string[][]
  totalRows: number
  fileType: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Get file extension and validate
    const fileName = file.name.toLowerCase()
    const fileType = getFileType(fileName)
    
    if (!fileType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please use CSV, Excel (.xlsx, .xls), or ODS files.' },
        { status: 400 }
      )
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    let parsedData: ParsedData

    try {
      switch (fileType) {
        case 'csv':
          parsedData = parseCSV(buffer)
          break
        case 'excel':
        case 'ods':
          parsedData = await parseExcelOrODS(buffer, fileType)
          break
        default:
          throw new Error('Unsupported file type')
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: `Failed to parse file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` },
        { status: 400 }
      )
    }

    // Validate parsed data
    if (!parsedData.headers.length) {
      return NextResponse.json(
        { error: 'No headers found in the file' },
        { status: 400 }
      )
    }

    if (parsedData.totalRows === 0) {
      return NextResponse.json(
        { error: 'No data rows found in the file' },
        { status: 400 }
      )
    }

    // Store the full parsed data in the response for the import step
    // In production, you'd want to store this in a temporary cache/database
    const allRows = await getAllRows(buffer, fileType)
    const fullData = {
      ...parsedData,
      allRows
    }

    return NextResponse.json({
      success: true,
      data: fullData
    })

  } catch (error) {
    console.error('Parse spreadsheet error:', error)
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    )
  }
}

function getFileType(fileName: string): string | null {
  if (fileName.endsWith('.csv')) return 'csv'
  if (fileName.endsWith('.xlsx')) return 'excel'
  if (fileName.endsWith('.xls')) return 'excel'
  if (fileName.endsWith('.ods')) return 'ods'
  return null
}

function parseCSV(buffer: ArrayBuffer): ParsedData {
  const text = new TextDecoder('utf-8').decode(buffer)
  
  // Parse CSV with headers
  const records = parse(text, {
    columns: false,
    skip_empty_lines: true,
    trim: true
  })

  if (records.length === 0) {
    throw new Error('CSV file is empty')
  }

  const headers = records[0] as string[]
  const dataRows = records.slice(1) as string[][]
  
  return {
    headers,
    sampleData: dataRows.slice(0, 5), // First 5 rows for preview
    totalRows: dataRows.length,
    fileType: 'csv'
  }
}

async function getAllRows(buffer: ArrayBuffer, fileType: string): Promise<string[][]> {
  switch (fileType) {
    case 'csv':
      return getAllRowsCSV(buffer)
    case 'excel':
    case 'ods':
      return await getAllRowsExcelOrODS(buffer)
    default:
      throw new Error('Unsupported file type')
  }
}

function getAllRowsCSV(buffer: ArrayBuffer): string[][] {
  const text = new TextDecoder('utf-8').decode(buffer)
  const records = parse(text, {
    columns: false,
    skip_empty_lines: true,
    trim: true
  })
  return records.slice(1) as string[][] // Skip headers
}

async function getAllRowsExcelOrODS(buffer: ArrayBuffer): Promise<string[][]> {
  const { parseExcelBuffer } = await import('@/lib/utils/excel-parser')
  const workbook = await parseExcelBuffer(buffer)
  
  if (workbook.sheets.length === 0) {
    throw new Error('No worksheets found in the file')
  }
  
  const sheetData = workbook.sheets[0].data
  
  return sheetData.slice(1).filter(row => 
    row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
  ).map(row => row.map(cell => String(cell || '')))
}

async function parseExcelOrODS(buffer: ArrayBuffer, fileType: string): Promise<ParsedData> {
  const { parseExcelBuffer } = await import('@/lib/utils/excel-parser')
  const workbook = await parseExcelBuffer(buffer)
  
  if (workbook.sheets.length === 0) {
    throw new Error('No worksheets found in the file')
  }
  
  const sheetData = workbook.sheets[0].data
  
  if (sheetData.length === 0) {
    throw new Error('Worksheet is empty')
  }
  
  const headers = sheetData[0].map(header => String(header || '').trim())
  const dataRows = sheetData.slice(1).filter(row => 
    row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
  ).map(row => row.map(cell => String(cell || '')))
  
  return {
    headers,
    sampleData: dataRows.slice(0, 5), // First 5 rows for preview
    totalRows: dataRows.length,
    fileType
  }
}
