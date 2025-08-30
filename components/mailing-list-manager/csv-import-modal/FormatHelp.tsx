'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function FormatHelp() {
  return (
    <Alert>
      <AlertCircle className='h-4 w-4' aria-hidden='true' />{' '}
      <AlertDescription>
        <p className='font-medium mb-1'>CSV Format Requirements:</p>
        <ul className='text-xs space-y-1 list-disc list-inside'>
          <li>First row must contain column headers</li>
          <li>
            Supported fields:{' '}
            <code className='font-mono'>
              first_name, last_name, email, phone, address, city, state,
              zip_code
            </code>
          </li>
          <li>
            Additional property fields:{' '}
            <code className='font-mono'>
              bedrooms, bathrooms, square_feet, year_built, estimated_value
            </code>
          </li>
          <li>Use comma (,) as delimiter</li>
        </ul>{' '}
      </AlertDescription>
    </Alert>
  );
}
