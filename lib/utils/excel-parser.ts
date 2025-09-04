/**
 * Secure Excel parsing utility using ExcelJS
 * Replaces the vulnerable xlsx package with a secure alternative
 */

import ExcelJS from 'exceljs';

export interface ParsedSheet {
  name: string;
  data: any[][];
}

export interface ParsedWorkbook {
  sheets: ParsedSheet[];
}

/**
 * Parse Excel file buffer using ExcelJS (secure alternative to xlsx)
 * @param buffer File buffer
 * @returns Parsed workbook data
 */
export async function parseExcelBuffer(buffer: ArrayBuffer): Promise<ParsedWorkbook> {
  const workbook = new ExcelJS.Workbook();
  
  try {
    await workbook.xlsx.load(buffer);
    
    const sheets: ParsedSheet[] = [];
    
    workbook.eachSheet((worksheet) => {
      const sheetData: any[][] = [];
      
      worksheet.eachRow((row) => {
        const rowData: any[] = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          rowData.push(cell.value);
        });
        sheetData.push(rowData);
      });
      
      sheets.push({
        name: worksheet.name,
        data: sheetData
      });
    });
    
    return { sheets };
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error}`);
  }
}

/**
 * Convert sheet data to array of objects using first row as headers
 * @param sheetData Raw sheet data
 * @returns Array of objects
 */
export function sheetToObjects(sheetData: any[][]): Record<string, any>[] {
  if (sheetData.length === 0) return [];
  
  const headers = sheetData[0];
  const rows = sheetData.slice(1);
  
  return rows.map(row => {
    const obj: Record<string, any> = {};
    headers.forEach((header, index) => {
      obj[String(header)] = row[index];
    });
    return obj;
  });
}