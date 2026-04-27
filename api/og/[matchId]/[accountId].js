/**
 * Dynamic OG Image Generator — Vercel Edge Function
 *
 * Returns an SVG social share card for a specific match analysis.
 * When shared on Discord/Twitter/iMessage, the preview shows:
 *   - Hero name + Grade + KDA + Win/Loss
 *
 * Falls back to the static og-share.png if the analysis isn't cached.
 *
 * Route: /api/og/[matchId]/[accountId]
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

module.exports = async function handler(req, res) {
  try {
    const { matchId, accountId } = req.query;

    if (!matchId || !accountId) {
      return redirectToStatic(res);
    }

    // Fetch cached analysis from Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: record } = await supabase
      .from('analyses')
      .select('data')
      .eq('match_id', Number(matchId))
      .eq('account_id', Number(accountId))
      .maybeSingle();

    if (!record?.data) {
      return redirectToStatic(res);
    }

    const analysis = record.data;
    const heroName = analysis.meta?.heroName || 'Unknown Hero';
    const grade = analysis.overall?.letterGrade || '?';
    const score = analysis.overall?.impactScore ?? 0;
    const won = analysis.meta?.won;
    const kda = analysis.modules?.combat?.kda ?? 0;
    const kills = analysis.modules?.combat?.kills ?? 0;
    const deaths = analysis.modules?.combat?.deaths ?? 0;
    const assists = analysis.modules?.combat?.assists ?? 0;
    const soulsPerMin = analysis.modules?.itemization?.soulsPerMin ?? 0;

    const resultText = won === true ? 'VICTORY' : won === false ? 'DEFEAT' : '';
    const resultColor = won === true ? '#22c55e' : won === false ? '#ef4444' : '#888';
    const gradeColor = score >= 80 ? '#22c55e' : score >= 60 ? '#d4a853' : score >= 40 ? '#f59e0b' : '#ef4444';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050506"/>
      <stop offset="100%" stop-color="#0a0a0f"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#d4a853"/>
      <stop offset="100%" stop-color="#b8860b"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Top accent line -->
  <rect x="0" y="0" width="1200" height="4" fill="url(#accent)"/>
  
  <!-- Grade Circle -->
  <circle cx="200" cy="315" r="100" fill="none" stroke="${gradeColor}" stroke-width="6" opacity="0.3"/>
  <circle cx="200" cy="315" r="85" fill="none" stroke="${gradeColor}" stroke-width="3"/>
  <text x="200" y="300" text-anchor="middle" fill="${gradeColor}" font-family="sans-serif" font-weight="bold" font-size="72">${grade}</text>
  <text x="200" y="340" text-anchor="middle" fill="#888" font-family="sans-serif" font-size="20">${score}/100</text>

  <!-- Hero Name -->
  <text x="380" y="200" fill="white" font-family="sans-serif" font-weight="bold" font-size="48">${escapeXml(heroName)}</text>
  
  <!-- Result Badge -->
  ${resultText ? `<text x="380" y="250" fill="${resultColor}" font-family="sans-serif" font-weight="bold" font-size="24" letter-spacing="4">${resultText}</text>` : ''}

  <!-- Stats -->
  <text x="380" y="320" fill="#d4a853" font-family="sans-serif" font-weight="bold" font-size="20" letter-spacing="3">KDA</text>
  <text x="500" y="320" fill="white" font-family="monospace" font-size="28">${kills} / ${deaths} / ${assists}</text>
  <text x="780" y="320" fill="#888" font-family="monospace" font-size="22">(${kda.toFixed(2)})</text>

  <text x="380" y="380" fill="#d4a853" font-family="sans-serif" font-weight="bold" font-size="20" letter-spacing="3">SOULS/MIN</text>
  <text x="560" y="380" fill="white" font-family="monospace" font-size="28">${soulsPerMin}</text>

  <!-- Branding -->
  <text x="380" y="520" fill="#d4a853" font-family="serif" font-weight="bold" font-size="32" letter-spacing="6">DEADLOCK</text>
  <text x="680" y="520" fill="#888" font-family="serif" font-size="32" letter-spacing="4">AFTERMATCH</text>
  
  <text x="380" y="560" fill="#555" font-family="sans-serif" font-size="16">aftermatch.xyz — Free post-match analytics</text>

  <!-- Bottom accent line -->
  <rect x="0" y="626" width="1200" height="4" fill="url(#accent)"/>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    return res.status(200).send(svg);
  } catch (err) {
    return redirectToStatic(res);
  }
};

function redirectToStatic(res) {
  res.setHeader('Location', 'https://www.aftermatch.xyz/images/og-share.png');
  return res.status(302).end();
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
