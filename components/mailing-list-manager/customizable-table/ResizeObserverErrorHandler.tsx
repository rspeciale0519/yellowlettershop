'use client';

import { useEffect } from 'react';

// Component to handle ResizeObserver errors
export function ResizeObserverErrorHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('ResizeObserver')) {
        event.stopImmediatePropagation();
        event.preventDefault();
        console.log('Suppressed ResizeObserver error in customizable-table');
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason &&
        event.reason.message &&
        event.reason.message.includes('ResizeObserver')
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
        console.log(
          'Suppressed ResizeObserver promise rejection in customizable-table'
        );
        return false;
      }
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null; // This component doesn't render anything
}