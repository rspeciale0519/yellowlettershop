// AccuZIP record fetching utilities
import type { ListCriteria } from '@/lib/supabase/mailing-lists';
import type { MailingListRecord } from '@/types/supabase';
import { criteriaToAccuZIPParams } from './params';
import { convertAccuZIPRecord } from './record';

const ACCUZIP_API_BASE =
  process.env.ACCUZIP_API_URL || 'https://api.accuzip.com/v1';
const ACCUZIP_API_KEY = process.env.ACCUZIP_API_KEY;

interface AccuZIPRawRecord {
  [key: string]: unknown;
}

interface AccuZIPResponse {
  success: boolean;
  data?: {
    records: AccuZIPRawRecord[];
    totalCount: number;
    hasMore: boolean;
  };
  error?: string;
}

/**
 * Fetch records from AccuZIP based on criteria
 */
export async function fetchRecords(
  criteria: ListCriteria,
  limit: number = 1000,
  offset: number = 0
): Promise<{ records: Partial<MailingListRecord>[]; totalCount: number; hasMore: boolean }> {
  if (!ACCUZIP_API_KEY) {
    console.warn('AccuZIP API key not configured');
    // Return empty result for development
    return { records: [], totalCount: 0, hasMore: false };
  }

  try {
    const params = criteriaToAccuZIPParams(criteria);
    params.limit = limit;
    params.offset = offset;

    const response = await fetch(`${ACCUZIP_API_BASE}/search`, {
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

    const result: AccuZIPResponse = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch records from AccuZIP');
    }

    const convertedRecords = result.data.records.map(convertAccuZIPRecord);

    return {
      records: convertedRecords,
      totalCount: result.data.totalCount,
      hasMore: result.data.hasMore,
    };
  } catch (error) {
    console.error('Failed to fetch records from AccuZIP:', error);
    throw error;
  }
}
