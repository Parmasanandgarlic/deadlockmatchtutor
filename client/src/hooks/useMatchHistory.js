import { useState, useEffect, useCallback } from 'react';
import { getPlayerMatches, syncPlayerMatches } from '../api/client';

export default function useMatchHistory(accountId) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  const fetchMatches = useCallback(async () => {
    if (!accountId) {
      setMatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getPlayerMatches(accountId);
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load matches.');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const sync = useCallback(async () => {
    if (!accountId) return;
    setIsSyncing(true);
    setError(null);
    try {
      await syncPlayerMatches(accountId);
      await fetchMatches();
    } catch (err) {
      setError(err.message || 'Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  }, [accountId, fetchMatches]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return { 
    matches, 
    loading, 
    isSyncing, 
    error, 
    refetch: fetchMatches,
    sync 
  };
}
