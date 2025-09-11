'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CollapsibleSectionProps } from './types';

export const CollapsibleSection = ({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  badge,
  children,
}: CollapsibleSectionProps) => {
  return (
    <Collapsible open={isOpen}>
      <CollapsibleTrigger
        onClick={onToggle}
        className='flex items-center justify-between w-full p-2 hover:bg-accent rounded-md transition-colors'
      >
        <div className='flex items-center gap-2'>
          <Icon className='h-4 w-4' />
          <h4 className='font-semibold'>{title}</h4>
          {badge !== undefined && badge !== null && badge !== 0 && (
            <Badge variant='outline' className='ml-2'>
              {badge}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className='h-4 w-4' />
        ) : (
          <ChevronDown className='h-4 w-4' />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className='pt-2'>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};