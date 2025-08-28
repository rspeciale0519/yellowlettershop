// AccuZIP count estimation utilities
import type { ListCriteria } from '@/lib/supabase/mailing-lists';
import { criteriaToAccuZIPParams } from './params';

const ACCUZIP_API_BASE =
  process.env.NEXT_PUBLIC_ACCUZIP_API_URL || 'https://api.accuzip.com/v1';
const ACCUZIP_API_KEY = process.env.ACCUZIP_API_KEY;

/**
 * Estimate the count of records matching the criteria
 */
export async function estimateRecordCount(
  criteria: ListCriteria
): Promise<number> {
  if (!ACCUZIP_API_KEY) {
    console.warn('AccuZIP API key not configured');
    // Return mock estimate for development
    return Math.floor(Math.random() * 10000) + 1000;
  }

  try {
    const params = criteriaToAccuZIPParams(criteria);

    const response = await fetch(`${ACCUZIP_API_BASE}/count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCUZIP_API_KEY}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`AccuZIP API error: ${response.statusText}`);
    }

    const data: unknown = await response.json();
    const raw = (data as { count?: unknown })?.count;
    const count = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(count) ? count : 0;
  } catch (error) {
    console.error('Failed to estimate record count:', error);
    // Return mock estimate on error
    return Math.floor(Math.random() * 10000) + 1000;
  }
}
