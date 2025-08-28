import { NextResponse } from 'next/server';
import { createListFromAccuZIPCriteria } from '@/lib/api/accuzip-integration';
import { createMailingList as createMailingListServer } from '@/lib/supabase/server-mailing-lists';
import { bulkImportRecords as bulkImportRecordsServer } from '@/lib/supabase/server-mailing-lists-extended';

export async function POST(req: Request) {
  try {
    // Enforce JSON input and parse safely
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Unsupported Media Type: use application/json' },
        { status: 415 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { name, criteria, options } = (body ?? {}) as {
      name?: unknown;
      criteria?: unknown;
      options?: {
        sampleSize?: unknown;
        deduplicationField?: unknown;
        description?: unknown;
        fetchLimit?: unknown;
      };
    };

    if (!name || !criteria) {
      return NextResponse.json(
        { error: 'Missing name or criteria' },
        { status: 400 }
      );
    }

    const result = await createListFromAccuZIPCriteria(
      name,
      criteria,
      options,
      {
        createMailingList: createMailingListServer,
        bulkImportRecords: bulkImportRecordsServer,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create list' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('AccuZIP create-list error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create list' },
      { status: 500 }
    );
  }
}
