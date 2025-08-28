import { NextRequest, NextResponse } from 'next/server';
import { bulkImportRecords } from '@/lib/supabase/mailing-lists-extended/csv';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415 }
      );
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { listId, records, deduplicationField } = body as Record<
      string,
      unknown
    >;
    if (typeof listId !== 'string' || !listId.trim()) {
      return NextResponse.json(
        { error: 'listId must be a non-empty string' },
        { status: 400 }
      );
    }
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'records must be a non-empty array' },
        { status: 400 }
      );
    }
    if (deduplicationField != null && typeof deduplicationField !== 'string') {
      return NextResponse.json(
        { error: 'deduplicationField must be a string if provided' },
        { status: 400 }
      );
    }
    // …rest of the try block…

    const result = await bulkImportRecords(listId, records, deduplicationField);

    return NextResponse.json({
      success: true,
      imported: result.success,
      failed: result.failed,
      duplicates: result.duplicates,
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV records' },
      { status: 500 }
    );
  }
}
