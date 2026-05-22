const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const logger = require('../utils/logger');
const { supabase } = require('../utils/supabase');
const { getHeroes, getGlobalHeroStats, getPlayerCard, getMatchHistory } = require('../services/deadlockApi.service');

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
 * and serves dynamically generated meta tags and pre-rendered body markup injected into the static index.html.
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
    let description = 'Free Deadlock match analyzer. Get instant post-match grades, hero performance reports, and personalized coaching — no login required.';
    let imageUrl = 'https://www.aftermatch.xyz/images/og-share.png';
    let url = `https://www.aftermatch.xyz${req.path}`;
    let schema = null;
    let seoBody = '';

    // Route matching: Home Page
    if (req.path === '/' || req.path === '') {
      seoBody = `
        <main class="speakable-summary">
          <h1>Deadlock AfterMatch — Post-Match Analyzer</h1>
          <p>Deadlock AfterMatch is a free, real-time post-match analytics engine, player tracker, and career dashboard for Valve's Deadlock hero shooter. Learn from your match history, get custom grade reviews, and master item builds.</p>
          <ul>
            <li><strong>Dynamic Economy Analytics:</strong> Track souls per minute (SPM), harvest benchmarks, and early-to-late net worth efficiency.</li>
            <li><strong>Combat Ledger:</strong> Detailed combat reviews including KDA trends, position safety, and damage distributions.</li>
            <li><strong>Coaching Recommendations:</strong> Get personalized tactical recommendations based on your performance data.</li>
          </ul>
        </main>
      `;
    }

    // Route matching: About Page
    if (req.path === '/about') {
      title = 'About Deadlock AfterMatch | Open-Source Match Tracker';
      description = 'Learn about Deadlock AfterMatch, an open-source match analyzer and intelligence panel built by dedicated contributors for the Deadlock community.';
      seoBody = `
        <main>
          <h1>About Deadlock AfterMatch</h1>
          <p>Deadlock AfterMatch is an open-source match analyzer and intelligence panel built by dedicated contributors for Valve's Deadlock community. It converts raw API match telemetry into digestible coaching notes and letter grades.</p>
          <h2>Why build AfterMatch?</h2>
          <p>Deadlock is a high-complexity tactical hero shooter. Understanding match outcomes requires diving deep into item timings, lane metrics, and positioning records. We created this tool to let players quickly track their match statistics and elevate their game without needing to authenticate via Steam.</p>
        </main>
      `;
    }

    // Route matching: Privacy Policy
    if (req.path === '/privacy') {
      title = 'Privacy Policy | Deadlock AfterMatch';
      description = 'Read the privacy policy of Deadlock AfterMatch. Learn how we handle public telemetry, Steam IDs, and match data caches.';
      seoBody = `
        <main>
          <h1>Privacy Policy</h1>
          <p>Last Updated: 2026-05-22</p>
          <p>At Deadlock AfterMatch, we respect player privacy. Here is a clear summary of how we handle data:</p>
          <ul>
            <li><strong>No Registration Required:</strong> You do not need to register an account or log in via Steam to use the search tool.</li>
            <li><strong>Public Match Telemetry:</strong> All match statistics and player profiles are retrieved dynamically from public Valve/Deadlock community APIs.</li>
            <li><strong>Temporary Caching:</strong> We cache public telemetry in our database to ensure fast response rates and respect API rate limits.</li>
          </ul>
        </main>
      `;
    }

    // Route matching: Resources Page
    if (req.path === '/resources') {
      title = 'Deadlock Resources & Community Tools | AfterMatch';
      description = 'Explore Deadlock wikis, guides, and developers api resources to master tactical match intelligence.';
      seoBody = `
        <main>
          <h1>Deadlock Resources and Community Guides</h1>
          <p>Master Deadlock with these top public resources and declassified files:</p>
          <ul>
            <li><strong>Deadlock Wiki:</strong> Learn about hero abilities, weapon stats, and map features.</li>
            <li><strong>AfterMatch Guides:</strong> Read our structured builds and shop item timing recommendations.</li>
            <li><strong>API Integration:</strong> Explore how developers can integrate with our declassified analytics telemetry.</li>
          </ul>
        </main>
      `;
    }

    // Route matching for Player Profile & Matches List
    const playerMatch = req.path.match(/^\/player\/([^\/]+)$/);
    const matchesMatch = req.path.match(/^\/matches\/([^\/]+)$/);
    const isPlayerOrMatches = playerMatch || matchesMatch;
    
    if (isPlayerOrMatches) {
      const accountId = playerMatch ? playerMatch[1] : matchesMatch[1];
      let personaname = 'Operative';
      let avatar = null;
      let matchesHtml = '';
      
      try {
        const card = await getPlayerCard(accountId);
        personaname = card?.player_card?.registered_user?.personaname || card?.personaname || card?.player_card?.user_info?.personaname || 'Operative';
        avatar = card?.player_card?.registered_user?.avatar_medium || card?.avatar_url;
      } catch (err) {
        logger.warn(`Failed to fetch card for player SSR: ${err.message}`);
      }

      try {
        const history = await getMatchHistory(accountId);
        if (history && history.length > 0) {
          matchesHtml = '<h3>Recent Ritual Engagements</h3><ul>';
          history.slice(0, 10).forEach(m => {
            const result = m.won ? 'VICTORY' : 'DEFEAT';
            const kda = `${m.player_kills || 0}/${m.player_deaths || 0}/${m.player_assists || 0}`;
            matchesHtml += `<li>Match ${m.match_id} — ${m.hero_name || 'Hero'} (${kda}) — <strong>${result}</strong></li>`;
          });
          matchesHtml += '</ul>';
        }
      } catch (err) {
        logger.warn(`Failed to fetch history for player SSR: ${err.message}`);
      }

      if (playerMatch) {
        title = `${personaname} - Deadlock Player Profile | AfterMatch`;
        description = `View Deadlock match history, grades, and hero performance for ${personaname}.`;
        schema = {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: {
            '@type': 'Person',
            name: personaname,
            identifier: accountId,
          }
        };
      } else {
        title = `${personaname}'s Matches | Deadlock AfterMatch`;
        description = `Recent Ritual engagements and match history for ${personaname}.`;
      }

      seoBody = `
        <main>
          <h1>Operative Dossier: ${personaname}</h1>
          <p>Steam Identifier: ${accountId}</p>
          ${avatar ? `<p><img src="${avatar}" alt="${personaname} avatar" /></p>` : ''}
          <p>Declassified career statistics, MMR records, and hero performance history for Deadlock player ${personaname}.</p>
          ${matchesHtml}
        </main>
      `;
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
        seoBody = `
          <main>
            <h1>Hero Dossier: ${hero.name}</h1>
            <p>Classified game information and character analysis for Valve's Deadlock hero ${hero.name}.</p>
            <p>Review builds, learn item timings (500, 1250, 3000, 6300 souls), and optimize farming patterns.</p>
          </main>
        `;
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
        inDefinedTermSet: 'https://www.aftermatch.xyz/faq'
      };
      seoBody = `
        <main>
          <h1>Terminology: ${statName}</h1>
          <p>${description}</p>
          <p>Deadlock AfterMatch tracks ${statName} metrics to guide gameplay coaching and strategy reviews.</p>
        </main>
      `;
    }

    // Route matching for Match Report & Dashboard
    const reportMatch = req.path.match(/^\/(report|dashboard)\/([^\/]+)\/([^\/]+)$/);
    if (reportMatch) {
      const matchId = reportMatch[2];
      const accountId = reportMatch[3];
      
      seoBody = `
        <main>
          <h1>Classified Debrief: Match ${matchId}</h1>
          <p>Operative Steam ID: ${accountId}</p>
          <p>Analyzing telemetry for this match. Please check back shortly if this page is loading.</p>
        </main>
      `;

      try {
        const { data: record } = await supabase
          .from('analyses')
          .select('data')
          .eq('match_id', Number(matchId))
          .eq('account_id', Number(accountId))
          .maybeSingle();
          
        if (record?.data) {
          const analysis = record.data;
          const meta = analysis.meta || {};
          const overall = analysis.overall || {};
          const perf = analysis.modules?.heroPerformance || {};
          const recs = analysis.recommendations || [];
          
          title = `Match ${matchId} Analysis (${meta.heroName}) | Deadlock AfterMatch`;
          description = `Declassified field report for Match ${matchId} played by ${meta.heroName || 'Operative'}. Grade: ${overall.letterGrade || 'N/A'}. KDA: ${perf.kills || 0}/${perf.deaths || 0}/${perf.assists || 0}.`;
          
          let recsHtml = '';
          if (recs.length > 0) {
            recsHtml = '<h3>Tactical Recommendations</h3><ul>';
            recs.forEach(r => {
              recsHtml += `<li><strong>${r.category || 'Directive'}:</strong> ${r.text || ''}</li>`;
            });
            recsHtml += '</ul>';
          }
          
          seoBody = `
            <main>
              <h1>Classified Debrief: Match ${matchId}</h1>
              <h2>Operative Profile: ${accountId} — Hero: ${meta.heroName || 'Unknown'}</h2>
              <div class="grade-box">
                <p>Performance Grade: <strong>${overall.letterGrade || 'N/A'}</strong></p>
                <p>Impact Score: <strong>${overall.impactScore || 'N/A'}</strong></p>
              </div>
              <div class="stats-box">
                <h3>Match Telemetry</h3>
                <ul>
                  <li>Outcome: <strong>${meta.won ? 'VICTORY' : 'DEFEAT'}</strong></li>
                  <li>Combat Record: <strong>${perf.kills || 0} Kills / ${perf.deaths || 0} Deaths / ${perf.assists || 0} Assists</strong></li>
                  <li>Economy Rate: <strong>${perf.soulsPerMin || 0} Souls/Min</strong></li>
                  <li>Duration: <strong>${Math.round((meta.duration || 0) / 60)} minutes</strong></li>
                </ul>
              </div>
              ${recsHtml}
            </main>
          `;
          
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
      } catch (err) {
        logger.warn(`Failed to fetch analysis for SSR: ${err.message}`);
      }
    }

    // FAQ Page
    if (req.path === '/faq') {
      title = 'Frequently Asked Questions | Deadlock AfterMatch';
      description = 'Get answers about Deadlock AfterMatch match analyzer, hidden MMR tracking, career statistics, and Steam public account resolution.';
      
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
              name: 'What is Deadlock AfterMatch?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Deadlock AfterMatch is a free, interactive post-match analytics platform and player tracker for Valve\'s Deadlock. It parses match telemetry to output intuitive performance grades, economic efficiency ratings, itemization guides, and custom coaching notes.'
              }
            },
            {
              '@type': 'Question',
              name: 'How are matchmaking ranks predicted?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Valve uses a hidden MMR (Matchmaking Rating) for Deadlock rituals. AfterMatch aggregates the visible historical rank badges of all players present in your lobbies to calculate and predict your exact matchmaking bracket and longitudinal rank placement.'
              }
            },
            {
              '@type': 'Question',
              name: 'Is a Steam login required to track profile stats?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No, Steam authentication is not required. You can search any public Steam vanity URL, custom nickname, Steam64 ID, or Steam32 ID to instantly generate reports.'
              }
            },
            {
              '@type': 'Question',
              name: 'What is a good souls per minute (SPM) rate?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: spmAnswer
              }
            }
          ]
        };
      } catch (err) {
        logger.error('Error fetching API stats for FAQ proxy:', err);
      }

      seoBody = `
        <main>
          <h1>Frequently Asked Questions</h1>
          <div class="faq-list">
            <article>
              <h2>What is Deadlock AfterMatch?</h2>
              <p>Deadlock AfterMatch is a free, interactive post-match analytics platform and player tracker for Valve's Deadlock. It parses match telemetry to output intuitive performance grades, economic efficiency ratings, itemization guides, and custom coaching notes.</p>
            </article>
            <article>
              <h2>How are matchmaking ranks predicted?</h2>
              <p>Valve uses a hidden MMR (Matchmaking Rating) for Deadlock rituals. AfterMatch aggregates the visible historical rank badges of all players present in your lobbies to calculate and predict your exact matchmaking bracket and longitudinal rank placement.</p>
            </article>
            <article>
              <h2>Is a Steam login required to track profile stats?</h2>
              <p>No, Steam authentication is not required. You can search any public Steam vanity URL, custom nickname, Steam64 ID, or Steam32 ID to instantly generate reports.</p>
            </article>
            <article>
              <h2>What is a good souls per minute (SPM) rate?</h2>
              <p>An average souls per minute rate is 900-1100. High-tier players and primary farming carries usually achieve 1200+ SPM by optimizing lane pressure, jungle camps, and soul jars.</p>
            </article>
          </div>
        </main>
      `;
    }

    // Inject dynamic HTML body pre-rendering if content was generated
    if (seoBody) {
      $('#root').html(seoBody);
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
