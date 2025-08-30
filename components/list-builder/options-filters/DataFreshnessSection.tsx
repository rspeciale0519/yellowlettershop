'use client';

import { CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OptionsCriteria } from '@/types/list-builder';

import type { OptionsCriteria } from '@/types/list-builder';

type DataFreshness = OptionsCriteria['dataFreshness'];
type DataFreshnessUpdate = <K extends keyof DataFreshness>(
  field: K,
  value: DataFreshness[K]
) => void;

interface DataFreshnessSectionProps {
            <Label htmlFor="max-age" className="text-sm font-medium">
              Maximum Data Age (months)
            </Label>
            <Select
              value={
                criteria.dataFreshness.maxAge != null
                  ? String(criteria.dataFreshness.maxAge)
                  : undefined
              }
              onValueChange={(value) => onUpdate("maxAge", Number.parseInt(value, 10))}
            >
              <SelectTrigger id="max-age" className="w-full mt-2">
                <SelectValue placeholder="Select max age" />
              </SelectTrigger>    <CardContent className='pt-0'>
      <div className='space-y-6'>
        <p className='text-sm text-gray-600 dark:text-gray-400'>
          Control the freshness and recency of your data.
        </p>

        <div className='space-y-4'>
          <div>
            <Label className='text-sm font-medium'>
              Maximum Data Age (months)
            </Label>
            <Select
              value={criteria.dataFreshness.maxAge.toString()}
              onValueChange={(value) =>
                onUpdate('maxAge', Number.parseInt(value))
              }
            >
              <SelectTrigger className='w-full mt-2'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='1'>1 month</SelectItem>
                <SelectItem value='3'>3 months</SelectItem>
                <SelectItem value='6'>6 months</SelectItem>
                <SelectItem value='12'>12 months</SelectItem>
                <SelectItem value='24'>24 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-center justify-between'>
            <Label
              htmlFor='require-recent-update'
              className='text-sm font-medium'
            >
              Require Recent Data Updates
            </Label>
            <Switch
              id='require-recent-update'
              checked={criteria.dataFreshness.requireRecentUpdate}
              onCheckedChange={(checked) =>
                onUpdate('requireRecentUpdate', checked)
              }
            />
          </div>
        </div>
      </div>
    </CardContent>
  );
}
