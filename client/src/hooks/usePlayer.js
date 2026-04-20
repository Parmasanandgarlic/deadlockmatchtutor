import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlayerMatches, resolvePlayer, syncPlayerMatches } from '../api/client';

/**
 * Hook to fetch and cache player match history.
 */
export function usePlayerMatches(accountId) {
  return useQuery({
    queryKey: ['playerMatches', accountId],
    queryFn: () => getPlayerMatches(accountId),
    enabled: !!accountId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // 60 seconds
    refetchIntervalInBackground: true,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to trigger a sync with the Deadlock API.
 */
export function useSyncPlayerMatches() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId) => syncPlayerMatches(accountId),
    onSuccess: (data, accountId) => {
      if (Array.isArray(data?.matches)) {
        queryClient.setQueryData(['playerMatches', accountId], data.matches);
      }
      queryClient.invalidateQueries({ queryKey: ['playerMatches', accountId] });
    },
  });
}

/**
 * Hook to resolve a player input with caching.
 */
export function usePlayerResolve(steamInput) {
  return useQuery({
    queryKey: ['playerResolve', steamInput],
    queryFn: () => resolvePlayer(steamInput),
    enabled: !!steamInput,
    staleTime: Infinity,
  });
}
