import { useQuery } from '@tanstack/react-query';
import { getPlayerProfile } from '../api/client';

/**
 * Fetch the unified player dossier (rank + career stats + top heroes).
 */
export function usePlayerProfile(accountId) {
  return useQuery({
    queryKey: ['playerProfile', accountId],
    queryFn: () => getPlayerProfile(accountId),
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
    refetchOnWindowFocus: false,
  });
}
