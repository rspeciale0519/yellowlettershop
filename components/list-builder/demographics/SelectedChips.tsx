'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface SelectedChipsProps {
  items: string[];
  onRemove: (index: number) => void;
}

export function SelectedChips({ items, onRemove }: SelectedChipsProps) {
  if (!items || items.length === 0) return null;
  return (
    <div className='flex flex-wrap gap-2'>
      {items.map((criterion, index) => (
        <Badge
          key={index}
          variant='outline'
          className='bg-white/50 border-yellow-300'
        >
          {criterion}
          <Button
            type='button'
            aria-label={`Remove ${criterion}`}
            title={`Remove ${criterion}`}
            variant='ghost'
            size='sm'
            className='h-4 w-4 p-0 ml-2 hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400'
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
          >
            <X aria-hidden='true' className='h-3 w-3' />
          </Button>
        </Badge>
      ))}
    </div>
  );
}
