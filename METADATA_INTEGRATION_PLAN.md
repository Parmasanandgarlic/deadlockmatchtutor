# Improved Metadata Client-Server Integration Plan

## Problem Summary
The product shows stale/static hero names and cannot display live images from the Deadlock Assets API because:
1. Client-side utilities (`client/src/utils/heroes.js`, `items.js`) only have hardcoded static mappings
2. No API endpoints exist for clients to fetch fresh metadata (heroes, items, ranks)
3. The server fetches metadata but doesn't expose it via dedicated endpoints
4. Client components like `HeroHeader.jsx` rely on `getHeroImage()` which needs API data for proper image URLs

## Root Causes Identified

### Server-Side (Working Correctly)
- ✅ `server/services/deadlockApi.service.js` has `getHeroes()`, `getItems()`, `getRanks()` fetching from `https://assets.deadlock-api.com/v2/*`
- ✅ `server/utils/heroes.js`, `items.js`, `ranks.js` have `setApi*()` functions and cache mechanisms
- ✅ `server/controllers/analysis.controller.js` fetches and caches metadata before running pipeline

### Client-Side (Broken)
- ❌ `client/src/utils/heroes.js` - Only static `HERO_NAMES` mapping, no API cache or `setApiHeroNames()`
- ❌ `client/src/utils/items.js` - Only empty `ITEM_NAMES`, no API cache or `setApiItemNames()`  
- ❌ `client/src/api/client.js` - No functions to fetch metadata from backend
- ❌ No dedicated metadata endpoints (`/api/heroes`, `/api/items`, `/api/ranks`)
- ❌ `client/src/utils/formatters.js#getHeroImage()` tries to use `hero.images` but client never receives this data

## Implementation Plan

### Phase 1: Server - Add Metadata Endpoints

#### 1.1 Create `server/controllers/meta.controller.js`
```javascript
const { getHeroes, getItems, getRanks } = require('../services/deadlockApi.service');
const logger = require('../utils/logger');

async function getHeroesHandler(req, res, next) {
  try {
    const heroes = await getHeroes();
    res.json(heroes);
  } catch (err) {
    logger.error(`Failed to serve heroes metadata: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch heroes metadata' });
  }
}

async function getItemsHandler(req, res, next) {
  try {
    const items = await getItems();
    res.json(items);
  } catch (err) {
    logger.error(`Failed to serve items metadata: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch items metadata' });
  }
}

async function getRanksHandler(req, res, next) {
  try {
    const ranks = await getRanks();
    res.json(ranks);
  } catch (err) {
    logger.error(`Failed to serve ranks metadata: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch ranks metadata' });
  }
}

module.exports = { getHeroesHandler, getItemsHandler, getRanksHandler };
```

#### 1.2 Create `server/routes/meta.routes.js`
```javascript
const { Router } = require('express');
const { getHeroesHandler, getItemsHandler, getRanksHandler } = require('../controllers/meta.controller');

const router = Router();

router.get('/heroes', getHeroesHandler);
router.get('/items', getItemsHandler);
router.get('/ranks', getRanksHandler);

module.exports = router;
```

#### 1.3 Update `server/routes/index.js`
Add the meta routes under `/api` prefix (consistent with existing structure):
```javascript
const metaRoutes = require('./meta.routes');
// ... existing imports
router.use('/meta', metaRoutes);  // Mounts as /api/meta/heroes, /api/meta/items, /api/meta/ranks
```

### Phase 2: Client - Add API Functions & Update Utilities

#### 2.1 Update `client/src/api/client.js`
Add metadata fetch functions:
```javascript
// ---- Metadata ----
export async function getHeroes() {
  const { data } = await api.get('/meta/heroes');
  return data;
}

export async function getItems() {
  const { data } = await api.get('/meta/items');
  return data;
}

export async function getRanks() {
  const { data } = await api.get('/meta/ranks');
  return data;
}
```

#### 2.2 Update `client/src/utils/heroes.js`
Replace static-only approach with API cache support:
```javascript
// Cache for API-provided hero data
let apiHeroData = null;

export function setApiHeroData(heroes) {
  if (Array.isArray(heroes)) {
    const heroMap = {};
    heroes.forEach(hero => {
      const id = hero?.id ?? hero?.hero_id ?? hero?.heroId;
      if (id != null) {
        heroMap[id] = hero;
        heroMap[String(id)] = hero;
      }
    });
    apiHeroData = heroMap;
  }
}

export function getHeroName(heroId) {
  if (heroId == null) return 'Unknown Hero';
  
  // Check API cache first
  if (apiHeroData && (apiHeroData[heroId] || apiHeroData[String(heroId)])) {
    const hero = apiHeroData[heroId] || apiHeroData[String(heroId)];
    return hero.name || hero;
  }
  
  // Fallback to static
  return HERO_NAMES[heroId] || `Hero #${heroId}`;
}

export function getHeroData(heroId) {
  if (heroId == null || !apiHeroData) return null;
  return apiHeroData[heroId] || apiHeroData[String(heroId)] || null;
}

// Keep existing HERO_NAMES, HERO_ROLES, ROLE_STYLES, getHeroRole exports
```

#### 2.3 Update `client/src/utils/items.js`
Similar pattern:
```javascript
let apiItemData = null;

export function setApiItemData(items) {
  if (Array.isArray(items)) {
    const itemMap = {};
    items.forEach(item => {
      const id = item?.id ?? item?.item_id ?? item?.itemId;
      if (id != null) {
        itemMap[id] = item;
        itemMap[String(id)] = item;
      }
    });
    apiItemData = itemMap;
  }
}

export function getItemName(itemId) {
  if (itemId == null) return 'Unknown Item';
  
  if (apiItemData && (apiItemData[itemId] || apiItemData[String(itemId)])) {
    const item = apiItemData[itemId] || apiItemData[String(itemId)];
    return item.name || item.item_name || item;
  }
  
  return ITEM_NAMES[itemId] || `Item #${itemId}`;
}

export function getItemData(itemId) {
  if (itemId == null || !apiItemData) return null;
  return apiItemData[itemId] || apiItemData[String(itemId)] || null;
}
```

### Phase 3: Client - Create Metadata Context/Hook

#### 3.1 Create `client/src/contexts/MetadataContext.jsx`
```jsx
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
          
          // Populate utility caches
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
```

#### 3.2 Wrap App with MetadataProvider
Update `client/src/main.jsx`:
```jsx
import { MetadataProvider } from './contexts/MetadataContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MetadataProvider>
      <App />
    </MetadataProvider>
  </React.StrictMode>
);
```

### Phase 4: Update Components to Use Live Data

#### 4.1 Update `client/src/hooks/useMatchAnalysis.js`
When receiving analysis data, extract and cache hero data if present:
```javascript
import { setApiHeroData } from '../utils/heroes';

// In onSuccess callback:
onSuccess: (data, { matchId, accountId }) => {
  queryClient.setQueryData(['analysis', matchId, accountId], data);
  
  // If response includes hero metadata, cache it
  if (data.meta?.heroData) {
    setApiHeroData([data.meta.heroData]);
  }
}
```

**Note**: This requires the server to include `meta.heroData` in analysis responses. Currently it doesn't. We need to check what the analysis response structure is.

#### 4.2 Verify/Update Analysis Response Structure
Check if `server/controllers/analysis.controller.js` returns hero data in the response. The `runPipeline` function should be checked to see what it returns in the `meta` field.

If not present, we may need to add hero/item data to the analysis response or rely solely on the MetadataContext approach.

## Alternative Simpler Approach (Recommended)

Given complexity, a simpler approach:

1. **Just add the metadata endpoints** (Phase 1)
2. **Update client utils** to have `setApiHeroData()` / `setApiItemData()` functions (Phase 2)
3. **Create a simple hook** that fetches metadata on app load and populates the caches
4. **Components automatically benefit** because `getHeroImage()`, `getHeroName()`, etc. will use the cached API data

This avoids needing to modify every component or the analysis response structure.

## Verification Checklist

- [ ] Server endpoints respond: `GET /api/meta/heroes`, `/api/meta/items`, `/api/meta/ranks`
- [ ] Client can fetch metadata successfully
- [ ] `HeroHeader.jsx` displays correct hero images from API URLs
- [ ] Hero names show correctly (not "Hero #123")
- [ ] Item names show correctly in itemization modules
- [ ] Rank images display properly in rank benchmarks

## Potential Issues to Watch

1. **CORS**: Ensure server allows cross-origin if client/server are on different domains
2. **Cache invalidation**: Metadata should refresh periodically (heroes/items change rarely, but ranks might)
3. **Error handling**: If metadata API fails, fall back gracefully to static data
4. **Bundle size**: Don't ship entire hero/item arrays to client unless necessary - consider lazy loading
5. **Type mismatches**: Ensure hero ID types match (number vs string keys in maps)
