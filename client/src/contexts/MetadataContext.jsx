import { createContext, useContext, useEffect, useState } from 'react';
import { getHeroes, getItems, getRanks } from '../api/client';
import { setApiHeroData } from '../utils/heroes';
import { setApiItemData } from '../utils/items';

const MetadataContext = createContext(null);

export function MetadataProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heroes, setHeroes] = useState([]);
  const [items, setItems] = useState([]);
  const [ranks, setRanks] = useState([]);

  useEffect(() => {
    let mounted = true;
    
    async function fetchMetadata() {
      try {
        setLoading(true);
        const [heroesData, itemsData, ranksData] = await Promise.all([
          getHeroes().catch(() => []),
          getItems().catch(() => []),
          getRanks().catch(() => [])
        ]);
        
        if (mounted) {
          setHeroes(heroesData);
          setItems(itemsData);
          setRanks(ranksData);
          
          // Populate utility caches so non-React code can access API data
          setApiHeroData(heroesData);
          setApiItemData(itemsData);
          
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchMetadata();
    
    return () => { mounted = false; };
  }, []);

  const value = { heroes, items, ranks, loading, error };
  
  return (
    <MetadataContext.Provider value={value}>
      {children}
    </MetadataContext.Provider>
  );
}

export function useMetadata() {
  const context = useContext(MetadataContext);
  if (!context) {
    throw new Error('useMetadata must be used within MetadataProvider');
  }
  return context;
}
