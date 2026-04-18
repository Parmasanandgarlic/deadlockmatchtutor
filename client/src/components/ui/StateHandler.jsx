import { useState, useEffect } from 'react';
import LoadingState from './LoadingState';
import EmptyState, { NoMatchesEmptyState, ErrorEmptyState } from './EmptyState';

// Wrapper component for handling loading, empty, and error states gracefully
export default function StateHandler({ 
  loading, 
  error, 
  empty, 
  children, 
  emptyType = 'default',
  emptyTitle,
  emptyDescription,
  emptyAction,
  loadingText 
}) {
  // Graceful loading state
  if (loading) {
    return <LoadingState progressText={loadingText} />;
  }

  // Error state
  if (error) {
    return (
      <ErrorEmptyState 
        message={error} 
        onRetry={empty?.onRetry} 
      />
    );
  }

  // Empty state
  if (empty?.show) {
    if (empty.type === 'noMatches') {
      return (
        <NoMatchesEmptyState accountId={empty.accountId} />
      );
    }
    return (
      <EmptyState
        type={emptyType}
        title={emptyTitle || empty.title}
        description={emptyDescription || empty.description}
        action={emptyAction || empty.action}
      />
    );
  }

  // Success state - render children
  return children;
}

// Hook for managing state transitions with delays for smooth UX
export function useGracefulState(promiseFn, deps = []) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null,
    empty: null,
  });

  useEffect(() => {
    let mounted = true;
    let timeoutId = null;

    const execute = async () => {
      try {
        // Minimum loading time for perceived stability
        const minLoadTime = new Promise(resolve => {
          timeoutId = setTimeout(resolve, 300);
        });

        const [result] = await Promise.all([
          promiseFn(),
          minLoadTime
        ]);

        if (!mounted) return;

        if (result === null || result === undefined) {
          setState({
            loading: false,
            error: null,
            data: null,
            empty: { show: true, type: 'default' },
          });
        } else if (Array.isArray(result) && result.length === 0) {
          setState({
            loading: false,
            error: null,
            data: result,
            empty: { show: true, type: 'noMatches' },
          });
        } else {
          setState({
            loading: false,
            error: null,
            data: result,
            empty: null,
          });
        }
      } catch (err) {
        if (!mounted) return;
        setState({
          loading: false,
          error: err.message || 'An unexpected error occurred',
          data: null,
          empty: null,
        });
      }
    };

    setState(prev => ({ ...prev, loading: true, error: null }));
    execute();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, deps);

  return state;
}
