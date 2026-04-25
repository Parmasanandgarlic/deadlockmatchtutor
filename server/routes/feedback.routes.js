const express = require('express');
const logger = require('../utils/logger');
const { supabase } = require('../utils/supabase');

const router = express.Router();

/**
 * POST /api/feedback
 *
 * Receives user-submitted bug reports and feature requests.
 * Stores them in the Supabase `feedback` table. Fails gracefully
 * if Supabase is unavailable — logs the payload so nothing is lost.
 *
 * Body: { severity, area, title, description, steps?, contextUrl?, userAgent? }
 */
router.post('/', async (req, res) => {
  const { severity, area, title, description, steps, contextUrl, userAgent } = req.body;

  // Validate required fields
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  const sanitize = (str) => (typeof str === 'string' ? str.slice(0, 2000).trim() : '');

  const payload = {
    severity: sanitize(severity) || 'low',
    area: sanitize(area) || 'general',
    title: sanitize(title),
    description: sanitize(description),
    steps: sanitize(steps) || null,
    context_url: sanitize(contextUrl) || null,
    user_agent: sanitize(userAgent) || null,
    submitted_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase.from('feedback').insert(payload);
    if (error) throw error;

    logger.info(`[Feedback] Bug report saved: "${payload.title}" (${payload.severity})`);
    return res.status(201).json({ success: true, message: 'Feedback received. Thank you!' });
  } catch (err) {
    // Always log the full payload so nothing is lost even if DB is down
    logger.error(`[Feedback] Failed to save to Supabase: ${err.message}`);
    logger.info(`[Feedback] Payload dump: ${JSON.stringify(payload)}`);
    return res.status(201).json({
      success: true,
      message: 'Feedback received (offline mode). We will review it shortly.',
    });
  }
});

module.exports = router;
