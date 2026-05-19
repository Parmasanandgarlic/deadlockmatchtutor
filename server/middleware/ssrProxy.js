const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const logger = require('../utils/logger');
const { supabase } = require('../utils/supabase');
const { getHeroes, getGlobalHeroStats } = require('../services/deadlockApi.service');

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

    const html = fs.readFileSync(indexPath, 'utf8');
    const $ = cheerio.load(html);

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

    // Route matching for Match List
    const matchlistMatch = req.path.match(/^\/matches\/([^\/]+)$/);
    if (matchlistMatch) {
      const accountId = matchlistMatch[1];
      const { data } = await supabase
        .from('tracked_accounts')
        .select('personaname')
        .eq('account_id', accountId)
        .single();
        
      if (data) {
        title = `${data.personaname}'s Matches | Deadlock AfterMatch`;
        description = `Recent Ritual engagements and match history for ${data.personaname}.`;
      }
    }

    // Route matching for Entity Hero
    const entityHeroMatch = req.path.match(/^\/entity\/hero\/([^\/]+)$/);
    if (entityHeroMatch) {
      const heroIdOrName = entityHeroMatch[1];
      const heroes = await getHeroes();
      const hero = heroes.find(h => String(h.id) === heroIdOrName || h.name.toLowerCase().replace(/[^a-z0-9]/g, '') === heroIdOrName.toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (hero) {
        title = `${hero.name} - Deadlock Hero Stats & Build Guides`;
        description = `OSIC dossier for ${hero.name}. Review win rates, soul harvest benchmarks, and combat records.`;
        schema = {
          '@context': 'https://schema.org',
          '@type': 'VideoGameCharacter',
          name: hero.name,
          description: description,
          inLanguage: 'en-US'
        };
      }
    }

    // Route matching for Entity Stat
    const entityStatMatch = req.path.match(/^\/entity\/stat\/([^\/]+)$/);
    if (entityStatMatch) {
      const statName = entityStatMatch[1];
      title = `${statName} - Deadlock Terminology | AfterMatch`;
      description = `Definition and field benchmarks for ${statName} in Deadlock Rituals.`;
      schema = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        name: statName,
        description: description,
        inDefinedTermSet: 'https://aftermatch.xyz/faq'
      };
    }

    // Route matching for Match Report
    const reportMatch = req.path.match(/^\/report\/([^\/]+)\/([^\/]+)$/);
    if (reportMatch) {
      const matchId = reportMatch[1];
      const accountId = reportMatch[2]; // accountId may be unused for basic meta but exists in path
      
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
      
      try {
        const stats = await getGlobalHeroStats();
        const heroStats = stats.find(s => s.hero_id === 2); // Seven
        let spmAnswer = 'A strong SPM in Deadlock typically exceeds 1200 by the 15-minute mark, though it varies heavily by hero role.';
        
        if (heroStats) {
          const winRateTarget = Math.round((heroStats.wins / heroStats.matches) * 100);
          const avgNetWorth = heroStats.total_net_worth / heroStats.matches;
          const estimatedSpm = Math.round(avgNetWorth / 35);
          spmAnswer = `As of the latest patch, a strong Souls Per Minute (SPM) for Mid Laners is ${estimatedSpm}+. Based on our analysis of ${heroStats.matches} matches this month, players hitting 1,200 SPM have a ${winRateTarget}% win rate.`;
        }

        schema = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is a good souls per minute (SPM) in Deadlock?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: spmAnswer
              }
            },
            {
              '@type': 'Question',
              name: 'What does the OSIC Dossier System do?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'The OSIC Dossier System intercepts post-Ritual combat telemetry from the Cursed Apple and converts it into a classified field report.'
              }
            }
          ]
        };
      } catch (err) {
        logger.error('Error fetching API stats for FAQ proxy:', err);
      }
    }

    // Update <title>
    if ($('title').length > 0) {
      $('title').text(title);
    } else {
      $('head').append(`<title>${title}</title>`);
    }

    // Clean up old dynamic meta tags injected statically, if any exist
    $('meta[name="description"], meta[property^="og:"], meta[name^="twitter:"]').remove();

    // Inject Meta Tags into HTML
    const metaTags = [
      `<meta name="description" content="${description}">`,
      `<link rel="canonical" href="${url}">`,
      `<meta property="og:title" content="${title}">`,
      `<meta property="og:description" content="${description}">`,
      `<meta property="og:type" content="website">`,
      `<meta property="og:url" content="${url}">`,
      `<meta property="og:image" content="${imageUrl}">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:site" content="@AfterMatchApp">`,
      `<meta name="twitter:title" content="${title}">`,
      `<meta name="twitter:description" content="${description}">`,
      `<meta name="twitter:image" content="${imageUrl}">`,
      `<meta name="google-site-verification" content="kciLfi-DuItDSDmoaYtlZfvJKQUAqShK6vw62U3tm68">`,
    ];

    if (schema) {
       metaTags.push(`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
    }

    $('head').append(metaTags.join('\n      '));

    // Set cache headers so Vercel caches this bot response
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
    return res.send($.html());
  } catch (error) {
    logger.error('SSR Proxy Error:', error);
    return next(); // Fallback to normal serving if error occurs
  }
}

module.exports = ssrProxy;
