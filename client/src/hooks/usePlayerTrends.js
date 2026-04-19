import { useState, useEffect } from 'react';
import { getPlayerTrends } from '../api/client';

export function usePlayerTrends(accountId, limit = 10) {
  const [trendsData, setTrendsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchTrends() {
      if (!accountId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getPlayerTrends(accountId, limit);
        if (isMounted) {
          setTrendsData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load player trend data.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchTrends();

    return () => {
      isMounted = false;
    };
  }, [accountId, limit]);

  return { trendsData, isLoading, error };
}
