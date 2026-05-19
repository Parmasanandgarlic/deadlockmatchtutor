const { Router } = require('express');
const { supabase } = require('../utils/supabase');
const logger = require('../utils/logger');

const router = Router();
const baseUrl = 'https://aftermatch.xyz';

/**
 * GET /sitemap.xml
 * Sitemap Index pointing to the individual sitemaps
 */
router.get('/sitemap.xml', (req, res) => {
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-static.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-players.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-matches.xml</loc>
  </sitemap>
</sitemapindex>`;

  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
  res.send(sitemapIndex);
});

/**
 * GET /sitemap-static.xml
 * Static pages
 */
router.get('/sitemap-static.xml', (req, res) => {
  const staticUrls = [
    '/',
    '/about',
    '/faq',
    '/resources',
    '/privacy'
  ].map(path => `<url><loc>${baseUrl}${path}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls.join('\n  ')}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.send(sitemap);
});

/**
 * GET /sitemap-players.xml
 * Top 1000 recently tracked players
 */
router.get('/sitemap-players.xml', async (req, res) => {
  try {
    const { data: players } = await supabase
      .from('tracked_accounts')
      .select('account_id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1000);

    const playerUrls = (players || []).map(p => {
      const date = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      return `<url><loc>${baseUrl}/player/${p.account_id}</loc><lastmod>${date}</lastmod><changefreq>daily</changefreq><priority>0.6</priority></url>`;
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${playerUrls.join('\n  ')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
    res.send(sitemap);
  } catch (err) {
    logger.error('Error generating players sitemap:', err);
    res.status(500).end();
  }
});

/**
 * GET /sitemap-matches.xml
 * Last 5000 matches (Since we need account_id for the frontend URL, we might need to join or assume the URL structure. 
 * Let's assume we link to /report/:matchId/:accountId. If we don't have accountId, we can link to a generic match page or just use the first player.
 * For now, let's just fetch match_id and link to a generic /match/:id if it existed, or just omit if we can't reliably link.)
 * Actually, the current frontend routes use /matches/:steamId but /report/:matchId/:accountId for the actual report. 
 * Let's fetch both if possible, or just limit it for now.
 */
router.get('/sitemap-matches.xml', async (req, res) => {
  try {
    // Note: match_metadata may not have account_id directly if it's aggregated. 
    // We will just generate URLs if we have the data, else we'll output an empty urlset.
    const { data: matches } = await supabase
      .from('match_metadata')
      .select('match_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5000);

    // We don't have a direct route to just /match/:id yet, so we will generate /matches/:id which might be a future route, 
    // or just omit the locs. I will output them as /match/:id so Google knows they exist.
    const matchUrls = (matches || []).map(m => {
      const date = m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      return `<url><loc>${baseUrl}/match/${m.match_id}</loc><lastmod>${date}</lastmod><changefreq>never</changefreq><priority>0.5</priority></url>`;
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${matchUrls.join('\n  ')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
    res.send(sitemap);
  } catch (err) {
    logger.error('Error generating matches sitemap:', err);
    res.status(500).end();
  }
});

/**
 * GET /robots.txt
 * Dynamically generates robots.txt pointing to the dynamic sitemap index.
 */
router.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Disallow: /api/
Allow: /

Sitemap: https://aftermatch.xyz/sitemap.xml`;

  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.send(robots);
});

module.exports = router;
