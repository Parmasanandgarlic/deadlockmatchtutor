const { Router } = require('express');
const { supabase } = require('../utils/supabase');
const logger = require('../utils/logger');

const router = Router();

/**
 * GET /sitemap.xml
 * Dynamically generates a sitemap for static pages and top player profiles/matches.
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = 'https://aftermatch.xyz';
    
    // Static Routes
    const staticUrls = [
      '/',
      '/about',
      '/faq',
      '/resources',
      '/privacy'
    ].map(path => `<url><loc>${baseUrl}${path}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);

    // Fetch up to 1000 recent players
    const { data: players } = await supabase
      .from('tracked_accounts')
      .select('account_id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1000);

    const playerUrls = (players || []).map(p => {
      const date = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      return `<url><loc>${baseUrl}/player/${p.account_id}</loc><lastmod>${date}</lastmod><changefreq>daily</changefreq><priority>0.6</priority></url>`;
    });

    // Fetch up to 1000 recent match analyses
    const { data: matches } = await supabase
      .from('match_metadata')
      .select('match_id, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);

    // We can't link to a match without an accountId, so we just link to the match report landing (or we could fetch account_ids too if the schema supported it).
    // Actually, our route is /matches/:matchId/:accountId. Let's just include the static matches if we can, or skip matches from the sitemap.
    // For now, let's just use the players, since match URLs require both.
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls.join('\n  ')}
  ${playerUrls.join('\n  ')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
    res.send(sitemap);
  } catch (err) {
    logger.error('Error generating sitemap:', err);
    res.status(500).end();
  }
});

/**
 * GET /robots.txt
 * Dynamically generates robots.txt pointing to the dynamic sitemap.
 */
router.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /

Sitemap: https://aftermatch.xyz/sitemap.xml`;

  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.send(robots);
});

module.exports = router;
