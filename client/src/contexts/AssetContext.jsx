import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDeadlockHeroes, getDeadlockItems } from '../api/client';

const AssetContext = createContext(null);

export function AssetProvider({ children }) {
  const { 
    data: heroesData, 
    isLoading: isLoadingHeroes,
    error: heroesError 
  } = useQuery({
    queryKey: ['assets', 'heroes'],
    queryFn: getDeadlockHeroes,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24,
  });

  const { 
    data: itemsData, 
    isLoading: isLoadingItems,
    error: itemsError 
  } = useQuery({
    queryKey: ['assets', 'items'],
    queryFn: getDeadlockItems,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24,
  });

  const heroesMap = useMemo(() => {
    if (!heroesData) return {};
    const map = {};
    const heroArray = Array.isArray(heroesData) ? heroesData : Object.values(heroesData);
    heroArray.forEach(hero => {
      // Use the numeric ID exactly as returned by the API (which the match history uses)
      if (hero && hero.id) {
        map[hero.id] = hero;
      }
    });
    return map;
  }, [heroesData]);

  const itemsMap = useMemo(() => {
    if (!itemsData) return {};
    const map = {};
    const itemsArray = Array.isArray(itemsData) ? itemsData : Object.values(itemsData);
    itemsArray.forEach(item => {
      if (item && item.id) {
        map[item.id] = item;
      }
    });
    return map;
  }, [itemsData]);

  const value = {
    heroesMap,
    itemsMap,
    isLoading: isLoadingHeroes || isLoadingItems,
    error: heroesError || itemsError,
  };

  return (
    <AssetContext.Provider value={value}>
      {children}
    </AssetContext.Provider>
  );
}

export function useAssets() {
  const context = useContext(AssetContext);
  if (!context) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
}
