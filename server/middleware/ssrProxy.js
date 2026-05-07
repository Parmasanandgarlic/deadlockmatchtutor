const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { supabase } = require('../utils/supabase');

// Known bot user agents that should trigger SSR
const BOT_AGENTS = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'slurp',
  'twitterbot',
  'facebookexternalhit',
  'linkedinbot',
  'embedly',
  'baiduspider',
  'pinterest',
  'slackbot',
  'vkshare',
  'facebot',
  'outbrain',
  'w3c_validator',
  'whatsapp',
  'discordbot'
];

/**
 * Express middleware that intercepts requests from known bots
 * and serves dynamically generated meta tags injected into the static index.html.
 */
async function ssrProxy(req, res, next) {
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const isBot = BOT_AGENTS.some(bot => userAgent.includes(bot));

  // If not a bot, or it's an API route, fall through to the normal static file server or API handler
  if (!isBot || req.path.startsWith('/api/') || req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|xml|txt)$/)) {
    return next();
  }

  try {
    const indexPath = path.join(__dirname, '../../client/dist/index.html');
    
    // In dev mode, the client might not be built yet. Fallback gracefully.
    if (!fs.existsSync(indexPath)) {
      return next();
    }

    let html = fs.readFileSync(indexPath, 'utf8');

    // Default SEO tags
    let title = 'Deadlock AfterMatch Match Analyzer';
    let description = 'Free Deadlock match analyzer. Get instant post-match grades, hero performance reports, and personalized coaching \u2014 no login required.';
    let imageUrl = 'https://aftermatch.xyz/images/og-share.webp';
    let url = `https://aftermatch.xyz${req.path}`;
    let schema = null;

    // Route matching for Player Profile
    const playerMatch = req.path.match(/^\/player\/([^\/]+)$/);
    if (playerMatch) {
      const accountId = playerMatch[1];
      const { data } = await supabase
        .from('tracked_accounts')
        .select('personaname')
        .eq('account_id', accountId)
        .single();
        
      if (data) {
        title = `${data.personaname} - Deadlock Player Profile | AfterMatch`;
        description = `View Deadlock match history, grades, and hero performance for ${data.personaname}.`;
        schema = {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: {
            '@type': 'Person',
            name: data.personaname,
            identifier: accountId,
          }
        };
      }
    }

    // Route matching for Match Report
    const reportMatch = req.path.match(/^\/report\/([^\/]+)\/([^\/]+)$/);
    if (reportMatch) {
      const matchId = reportMatch[1];
      const accountId = reportMatch[2];
      
      const { data } = await supabase
        .from('match_metadata')
        .select('match_id')
        .eq('match_id', matchId)
        .single();
        
      if (data) {
        title = `Match ${matchId} Analysis | Deadlock AfterMatch`;
        description = `Detailed post-match report and performance grades for Match ${matchId}.`;
        schema = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description: description,
          author: {
            '@type': 'Organization',
            name: 'Deadlock AfterMatch contributors'
          },
          publisher: {
            '@type': 'Organization',
            name: 'Deadlock AfterMatch'
          },
          mainEntityOfPage: url
        };
      }
    }

    // Guide/FAQ Pages
    if (req.path === '/faq') {
      title = 'Deadlock AfterMatch FAQ';
      description = 'Answers about Deadlock AfterMatch match analysis, Steam ID lookup, and grading.';
    }

    // Inject Meta Tags into HTML
    const metaTags = `
      <title>${title}</title>
      <meta name="description" content="${description}" />
      <link rel="canonical" href="${url}" />
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="${url}" />
      <meta property="og:image" content="${imageUrl}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@AfterMatchApp" />
      <meta name="twitter:title" content="${title}" />
      <meta name="twitter:description" content="${description}" />
      <meta name="twitter:image" content="${imageUrl}" />
      ${schema ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>` : ''}
    `;

    // Replace the first <title>...</title> block, or just insert before </head>
    html = html.replace(/<title>.*?<\/title>/, '');
    html = html.replace('</head>', `${metaTags}\n</head>`);

    // Set cache headers so Vercel caches this bot response
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
    return res.send(html);
  } catch (error) {
    logger.error('SSR Proxy Error:', error);
    return next(); // Fallback to normal serving if error occurs
  }
}

module.exports = ssrProxy;
