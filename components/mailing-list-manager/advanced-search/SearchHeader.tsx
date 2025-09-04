'use client';

interface SearchHeaderProps {
  isOpen: boolean;
  /** Region id used by the controlling button's aria-controls */
  id?: string;
  labelledById?: string;
  /** Optional additional classes for the outer container */
  className?: string;
}

export function SearchHeader({ isOpen, id, labelledById, className }: SearchHeaderProps) {
  return (
    <div className={className}>
      <div className='bg-card rounded-md p-3 pt-2'>
        <div className='mb-4 text-sm'>
          <h3 id={labelledById} className='text-base font-bold mb-1'>
            Advanced Search
          </h3>
          <p className='mb-2'>
            Use the options below to create precise filters for your mailing
            lists and records.
          </p>
          <p className='text-muted-foreground mb-1'>
            Filters are applied automatically as you make changes.
          </p>
        </div>
      </div>
    </div>
  );
}
