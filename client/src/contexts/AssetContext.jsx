import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDeadlockHeroes, getDeadlockItems } from '../api/client';
import { useMetadata } from './MetadataContext';

const AssetContext = createContext(null);

export function AssetProvider({ children }) {
  const metadata = useMetadata();
  const hasMetadataHeroes = Array.isArray(metadata.heroes) && metadata.heroes.length > 0;
  const hasMetadataItems = Array.isArray(metadata.items) && metadata.items.length > 0;

  const { 
    data: heroesData, 
    isLoading: isLoadingHeroes,
    error: heroesError 
  } = useQuery({
    queryKey: ['assets', 'heroes'],
    queryFn: getDeadlockHeroes,
    enabled: !metadata.loading && !hasMetadataHeroes,
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
    enabled: !metadata.loading && !hasMetadataItems,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24,
  });

  const resolvedHeroesData = hasMetadataHeroes ? metadata.heroes : heroesData;
  const resolvedItemsData = hasMetadataItems ? metadata.items : itemsData;

  const heroesMap = useMemo(() => {
    if (!resolvedHeroesData) return {};
    const map = {};
    const heroArray = Array.isArray(resolvedHeroesData) ? resolvedHeroesData : Object.values(resolvedHeroesData);
    heroArray.forEach(hero => {
      if (!hero) return;
      const id = hero.id ?? hero.hero_id ?? hero.heroId;
      if (id != null) {
        // Store both numeric and string keys so callers can use either form.
        map[id] = hero;
        map[String(id)] = hero;
      }
    });
    return map;
  }, [resolvedHeroesData]);

  const itemsMap = useMemo(() => {
    if (!resolvedItemsData) return {};
    const map = {};
    const itemsArray = Array.isArray(resolvedItemsData) ? resolvedItemsData : Object.values(resolvedItemsData);
    itemsArray.forEach(item => {
      if (!item) return;
      const id = item.id ?? item.item_id ?? item.itemId;
      if (id != null) {
        map[id] = item;
        map[String(id)] = item;
      }
    });
    return map;
  }, [resolvedItemsData]);

  const value = {
    heroesMap,
    itemsMap,
    isLoading: metadata.loading || isLoadingHeroes || isLoadingItems,
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
