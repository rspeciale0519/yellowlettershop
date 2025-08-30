'use client';

import type React from 'react';
import type { ReactNode } from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface SectionHeaderProps {
  title: ReactNode;
  icon?: React.ReactNode;
  description?: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  contentId?: string;
  className?: string;
}

export function SectionHeader({
  title,
  icon,
  description,
  expanded,
  onToggle,
  contentId,
  className,
}: SectionHeaderProps) {
  return (
    <CardHeader className={className}>
      <CardTitle>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={contentId}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
          {expanded ? (
            <ChevronUp className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </CardTitle>
      {description ? <CardDescription>{description}</CardDescription> : null}
    </CardHeader>
  );
}
