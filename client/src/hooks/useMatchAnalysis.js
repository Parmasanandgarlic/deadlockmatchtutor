import { useState, useCallback } from 'react';
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
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressStage, setProgressStage] = useState(0);
  const [progressText, setProgressText] = useState('');

  const startAnalysis = useCallback(async (matchId, accountId) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setProgressStage(0);

    // Simulate progressive loading text while the request is in-flight
    const interval = setInterval(() => {
      setProgressStage((prev) => {
        const next = Math.min(prev + 1, PROGRESS_STAGES.length - 1);
        setProgressText(PROGRESS_STAGES[next]);
        return next;
      });
    }, 2500);

    try {
      const result = await runAnalysis(matchId, accountId);
      setAnalysis(result);
    } catch (err) {
      setError(err.message || 'Analysis failed.');
    } finally {
      clearInterval(interval);
      setLoading(false);
      setProgressText('');
    }
  }, []);

  const loadCached = useCallback(async (matchId, accountId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCachedAnalysis(matchId, accountId);
      setAnalysis(result);
    } catch (err) {
      setError(err.message || 'Report not found.');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analysis,
    loading,
    error,
    progressText,
    progressStage,
    startAnalysis,
    loadCached,
  };
}
