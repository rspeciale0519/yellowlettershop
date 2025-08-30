'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Users, Target, Settings } from 'lucide-react';
import type { PredictiveFiltersState, PredictiveModel } from './types';

interface FilterSummaryProps {
  state: PredictiveFiltersState;
  selectedModelData: PredictiveModel | undefined;
  estimatedCount: number;
  totalCount: number;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

export function FilterSummary({
  state,
  selectedModelData,
  estimatedCount,
  totalCount,
  onApplyFilters,
  onResetFilters,
}: FilterSummaryProps) {
  const reductionPercentage =
    totalCount > 0
      ? Math.round(((totalCount - estimatedCount) / totalCount) * 100)
      : 0;
  const hasActiveFilters =
    state.enablePredictive &&
    (state.scoreRange.min > 0 || state.scoreRange.max < 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center space-x-2'>
          <Target className='h-5 w-5' />
          <span>Filter Summary</span>
        </CardTitle>
        <CardDescription>
          Review your predictive filtering configuration
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {state.enablePredictive ? (
          <>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Selected Model:</span>
                <Badge variant='default'>
                  {selectedModelData?.name || 'None'}
                </Badge>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Score Range:</span>
                <Badge variant='outline'>
                  {state.scoreRange.min}% - {state.scoreRange.max}%
                </Badge>
              </div>

              {state.showAdvanced && (
                <>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>
                      Confidence Threshold:
                    </span>
                    <Badge variant='outline'>
                      {state.customThreshold != null
                        ? `${state.customThreshold}%`
                        : '—'}
                    </Badge>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>
                      Include Uncertain:
                    </span>
                    <Badge
                      variant={state.includeUncertain ? 'default' : 'secondary'}
                    >
                      {state.includeUncertain ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </>
              )}
            </div>

            <Separator />

            <div className='space-y-3'>
              <div className='flex items-center space-x-2'>
                <Users className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm font-medium'>Impact Analysis</span>
              </div>

              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div className='space-y-1'>
                  <span className='text-muted-foreground'>Original Count:</span>
                  <div className='font-medium'>
                    {totalCount.toLocaleString()}
                  </div>
                </div>
                <div className='space-y-1'>
                  <span className='text-muted-foreground'>Filtered Count:</span>
                  <div className='font-medium text-primary'>
                    {estimatedCount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-between pt-2 border-t'>
                <span className='text-sm text-muted-foreground'>
                  Reduction:
                </span>
                <div className='flex items-center space-x-1'>
                  <TrendingUp className='h-3 w-3 text-green-600' />
                  <span className='text-sm font-medium text-green-600'>
                    {reductionPercentage}% more targeted
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className='flex space-x-2'>
              <Button onClick={onApplyFilters} className='flex-1'>
                Apply Filters
              </Button>
              <Button variant='outline' onClick={onResetFilters}>
                Reset
              </Button>
            </div>
          </>
        ) : (
          <div className='text-center py-8 space-y-4'>
            <div className='mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center'>
              <Settings className='h-6 w-6 text-muted-foreground' />
            </div>
            <div className='space-y-2'>
              <p className='text-sm font-medium'>
                Predictive Filtering Disabled
              </p>
              <p className='text-xs text-muted-foreground'>
                Enable predictive filtering to optimize your mailing list
              </p>
            </div>
            <div className='text-sm text-muted-foreground'>
              Total Recipients:{' '}
              <span className='font-medium'>{totalCount.toLocaleString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
