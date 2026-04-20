import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { runAnalysis, getCachedAnalysis } from '../api/client';

const PROGRESS_STAGES = [
  'Fetching Match Data...',
  'Downloading Replay...',
  'Decompressing Replay...',
  'Parsing Demo File...',
  'Analyzing Economy...',
  'Analyzing Itemization...',
  'Analyzing Combat...',
  'Analyzing Objectives...',
  'Generating Insights...',
  'Finalizing Report...',
];

export default function useMatchAnalysis() {
  const [progressStage, setProgressStage] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [cachedLoading, setCachedLoading] = useState(false);
  const [cachedError, setCachedError] = useState(null);
  const queryClient = useQueryClient();

  const analysisMutation = useMutation({
    mutationFn: ({ matchId, accountId }) => runAnalysis(matchId, accountId),
    onSuccess: (data, { matchId, accountId }) => {
      setAnalysis(data);
      // Globally cache result
      queryClient.setQueryData(['analysis', matchId, accountId], data);
    },
  });

  const loadCached = useCallback(async (matchId, accountId) => {
    const queryKey = ['analysis', matchId, accountId];
    const cached = queryClient.getQueryData(queryKey);
    if (cached) {
      setAnalysis(cached);
      setCachedError(null);
      return cached;
    }

    setCachedLoading(true);
    setCachedError(null);
    try {
      const data = await getCachedAnalysis(matchId, accountId);
      queryClient.setQueryData(queryKey, data);
      setAnalysis(data);
      return data;
    } catch (err) {
      setCachedError(err?.message || 'Failed to load cached analysis.');
      throw err;
    } finally {
      setCachedLoading(false);
    }
  }, [queryClient]);

  const startAnalysis = useCallback(async (matchId, accountId) => {
    setProgressStage(0);
    setProgressText(PROGRESS_STAGES[0]);

    // Simulate progressive loading text
    const interval = setInterval(() => {
      setProgressStage((prev) => {
        const next = Math.min(prev + 1, PROGRESS_STAGES.length - 1);
        setProgressText(PROGRESS_STAGES[next]);
        return next;
      });
    }, 2500);

    try {
      await analysisMutation.mutateAsync({ matchId, accountId });
    } catch (err) {
      // Error is handled by mutation state
    } finally {
      clearInterval(interval);
      setProgressText('');
    }
  }, [analysisMutation]);

  return {
    analysis: analysis ?? analysisMutation.data,
    loading: analysisMutation.isPending || cachedLoading,
    error: analysisMutation.error?.message || cachedError,
    progressText,
    progressStage,
    startAnalysis,
    loadCached,
  };
}
