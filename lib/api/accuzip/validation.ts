import 'server-only';

// AccuZIP validation utilities
const ACCUZIP_API_BASE =
  process.env.NEXT_PUBLIC_ACCUZIP_API_URL || 'https://api.accuzip.com/v1';
const ACCUZIP_API_KEY = process.env.ACCUZIP_API_KEY;

/**
 * Validate an address with AccuZIP
 */
export async function validateAddress(address: {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
}): Promise<{
  valid: boolean;
  standardized?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    plus4?: string;
  };
  errors?: string[];
}> {
  if (!ACCUZIP_API_KEY) {
    if (process.env.NODE_ENV !== 'production' || process.env.ACCUZIP_SKIP_VALIDATION === 'true') {
      console.warn('AccuZIP: API key not configured; skipping validation');
      return { valid: true };
    }
    console.error('AccuZIP: API key missing in production');
    return { valid: false, errors: ['API key not configured'] };
  }

  try {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 10_000);
    
    const response = await fetch(`${ACCUZIP_API_BASE}/validate/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${ACCUZIP_API_KEY}`
      },
      body: JSON.stringify(address),
      signal: ctrl.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AccuZIP API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      valid: !!result?.valid,
      standardized: result?.standardized,
      errors: Array.isArray(result?.errors) ? result.errors.map(String) : undefined,
    };
  } catch (error) {
    console.error('Failed to validate address:', error);
    return { valid: false, errors: ['Validation service unavailable'] };
  }
}

/**
 * Batch validate records with AccuZIP
 */
export async function batchValidateRecords(
  records: Array<{ id: string; [key: string]: unknown }>,
  validationType: 'address' | 'full' = 'address'
): Promise<Array<{ recordId: string; valid: boolean; errors?: string[] }>> {
  if (!ACCUZIP_API_KEY) {
    if (process.env.NODE_ENV !== 'production' || process.env.ACCUZIP_SKIP_VALIDATION === 'true') {
      console.warn('AccuZIP: API key not configured; skipping batch validation');
      return records.map(r => ({ recordId: String(r.id), valid: true }));
    }
    console.error('AccuZIP: API key missing in production');
    return records.map(r => ({ recordId: String(r.id), valid: false, errors: ['API key not configured'] }));
  }

  try {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 10_000);

    const response = await fetch(`${ACCUZIP_API_BASE}/validate/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${ACCUZIP_API_KEY}`
      },
      body: JSON.stringify({
        records,
        validationType
      }),
      signal: ctrl.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AccuZIP API error: ${response.statusText}`);
    }

    const result = await response.json();
    return Array.isArray(result?.validations)
      ? result.validations.map((v: { recordId?: unknown; valid?: unknown; errors?: unknown }) => ({
          recordId: String(v.recordId),
          valid: !!v.valid,
          errors: Array.isArray(v.errors) ? v.errors.map(String) : undefined,
        }))
      : records.map(r => ({
          recordId: String(r.id),
          valid: false,
          errors: ['Invalid response from validation service'],
        }));
  } catch (error) {
    console.error('Failed to batch validate records:', error);
    return records.map((r) => ({
      recordId: String(r.id),
      valid: false,
      errors: ['Validation service unavailable'],
    }));
  }
}
