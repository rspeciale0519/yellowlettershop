'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { ScoreRange } from './types';
import { useId } from 'react';
import type { ChangeEvent } from 'react';

interface ScoreRangeSliderProps {
  scoreRange: ScoreRange;
  onScoreRangeChange: (range: ScoreRange) => void;
  estimatedCount?: number;
}

export function ScoreRangeSlider({
  scoreRange,
  onScoreRangeChange,
  estimatedCount,
}: ScoreRangeSliderProps) {
  const handleSliderChange = (values: number[]) => {
    onScoreRangeChange({ min: values[0], max: values[1] });
  };

  const handleMinChange = (value: string) => {
    const min = Math.max(0, Math.min(100, parseInt(value) || 0));
    if (min <= scoreRange.max) {
      onScoreRangeChange({ ...scoreRange, min });
    }
  };

  const handleMaxChange = (value: string) => {
    const max = Math.max(0, Math.min(100, parseInt(value) || 100));
    if (max >= scoreRange.min) {
      onScoreRangeChange({ ...scoreRange, max });
    }
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Medium';
    if (score >= 40) return 'Low';
    return 'Very Low';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
            <Slider
              value={[scoreRange.min, scoreRange.max]}
              onValueChange={handleSliderChange}
              max={100}
              min={0}
              step={1}
              className="w-full"
              aria-label="Score range"
            />
            <Slider
              value={[scoreRange.min, scoreRange.max]}
              onValueChange={handleSliderChange}
              max={100}
              min={0}
              step={1}
              className='w-full'
            />
          </div>

          <div className='flex items-center justify-between text-sm text-muted-foreground'>
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='min-score'>Minimum Score</Label>
            <div className='flex items-center space-x-2'>
              <Input
                id='min-score'
                type='number'
                min='0'
                max='100'
                value={scoreRange.min}
                onChange={(e) => handleMinChange(e.target.value)}
                className='w-20'
              />
              <Badge
                variant='outline'
                className={`${getScoreColor(
                  scoreRange.min
                )} text-white border-0`}
              >
                {getScoreLabel(scoreRange.min)}
              </Badge>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='max-score'>Maximum Score</Label>
            <div className='flex items-center space-x-2'>
              <Input
                id='max-score'
                type='number'
                min='0'
                max='100'
                value={scoreRange.max}
                onChange={(e) => handleMaxChange(e.target.value)}
                className='w-20'
        {estimatedCount !== undefined && (
          <div className="pt-4 border-t">
            <div
              className="flex items-center justify-between text-sm"
              role="status"
              aria-live="polite"
            >
              <span className="text-muted-foreground">Estimated recipients:</span>
              <Badge variant="secondary">{estimatedCount.toLocaleString()}</Badge>
            </div>
          </div>
        )}
              >
                {getScoreLabel(scoreRange.max)}
              </Badge>
            </div>
          </div>
        </div>

        {estimatedCount !== undefined && (
          <div className='pt-4 border-t'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>
                Estimated recipients:
              </span>
              <Badge variant='secondary'>
                {estimatedCount.toLocaleString()}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
