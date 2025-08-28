import { NextResponse } from 'next/server';
import type { ListCriteria } from '@/lib/supabase/mailing-lists';
import { fetchRecords } from '@/lib/api/accuzip';

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Validate body structure
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Invalid request body structure' },
        { status: 400 }
      );
    }

    const bodyObj = body as Record<string, unknown>;
    
    // Safely extract properties from body object
    const criteria = bodyObj.criteria;
    const rawLimit = bodyObj.limit;
    const rawOffset = bodyObj.offset;

    // Validate criteria structure
    if (!criteria || typeof criteria !== 'object' || Array.isArray(criteria)) {
      return NextResponse.json(
        { error: 'Invalid or missing criteria' },
        { status: 400 }
      );
    }

    // Type assertion is necessary here after validation
    const validatedCriteria = criteria as ListCriteria;

    const limit: number = Number.isFinite(Number(rawLimit))
      ? Math.max(1, Number(rawLimit))
      : 50;
    const offset: number = Number.isFinite(Number(rawOffset))
      ? Math.max(0, Number(rawOffset))
      : 0;

    const result = await fetchRecords(validatedCriteria, limit, offset);
    return NextResponse.json(result);
  } catch (err) {
    console.error('AccuZIP search error:', err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Failed to search records',
      },
      { status: 500 }
    );
  }
}
