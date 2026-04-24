const { Router } = require('express');
const authService = require('../services/auth.service');
const steamService = require('../services/steam.service');
const config = require('../config');
const logger = require('../utils/logger');

const router = Router();

/**
 * @swagger
 * /api/auth/steam:
 *   get:
 *     summary: Initiate Steam login
 *     description: Redirects user to Steam OpenID authentication page
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Steam login page
 */
router.get('/steam', (req, res, next) => {
  if (!authService.isConfigured) {
    return res.status(503).json({ error: 'Authentication service not configured' });
  }
  
  // Track auth initiation event
  authService.trackEvent(
    req.user?.id || null,
    'auth_steam_initiated',
    { ip: req.ip },
    req.ip,
    req.get('user-agent')
  ).catch(() => {});
  
  next();
}, authService.passport.authenticate('steam'));

/**
 * @swagger
 * /api/auth/steam/return:
 *   get:
 *     summary: Steam login callback
 *     description: Handles Steam OpenID callback and creates user session
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to application home page with session
 */
router.get('/steam/return', (req, res, next) => {
  if (!authService.isConfigured) {
    return res.status(503).json({ error: 'Authentication service not configured' });
  }
  
  authService.passport.authenticate('steam', {
    successRedirect: config.isDev ? 'http://localhost:5173' : 'https://www.aftermatch.xyz',
    failureRedirect: config.isDev ? 'http://localhost:5173/login' : 'https://www.aftermatch.xyz/login',
  })(req, res, next);
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 steamId:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 avatar:
 *                   type: string
 *                 isPremium:
 *                   type: boolean
 *       401:
 *         description: Not authenticated
 */
router.get('/me', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ authenticated: false });
  }
  
  try {
    const userProfile = await authService.getCurrentUser(req);
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Track profile view
    authService.trackEvent(
      userProfile.id,
      'profile_view',
      { viewed_own: true },
      req.ip,
      req.get('user-agent')
    ).catch(() => {});
    
    res.json({
      authenticated: true,
      user: userProfile,
    });
  } catch (error) {
    logger.error('Error fetching current user:', error.message);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Destroys the user session and logs them out
 *     tags: [Authentication]
 *     security:
 * checkAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post('/logout', (req, res) => {
  if (req.user) {
    // Track logout event
    authService.trackEvent(
      req.user.id,
      'auth_logout',
      {},
      req.ip,
      req.get('user-agent')
    ).catch(() => {});
  }
  
  req.logout((err) => {
    if (err) {
      logger.error('Logout error:', err.message);
    }
    res.clearCookie('aftermatch.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

/**
 * @swagger
 * /api/auth/favorites:
 *   get:
 *     summary: Get user favorites
 *     description: Returns all favorited players and matches for the authenticated user
 *     tags: [Favorites]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [player, match]
 *         description: Filter by favorite type
 *     responses:
 *       200:
 *         description: List of favorites
 *       401:
 *         description: Not authenticated
 */
router.get('/favorites', authService.isAuthenticated(), async (req, res) => {
  try {
    const { type } = req.query;
    const favorites = await authService.getUserFavorites(req.user.id, type);
    
    res.json({ favorites });
  } catch (error) {
    logger.error('Error fetching favorites:', error.message);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

/**
 * @swagger
 * /api/auth/favorites:
 *   post:
 *     summary: Add to favorites
 *     description: Add a player or match to user favorites
 *     tags: [Favorites]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - targetId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [player, match]
 *               targetId:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Favorite added successfully
 *       401:
 *         description: Not authenticated
 */
router.post('/favorites', authService.isAuthenticated(), async (req, res) => {
  try {
    const { type, targetId, notes } = req.body;
    
    if (!type || !targetId) {
      return res.status(400).json({ error: 'Type and targetId are required' });
    }
    
    if (!['player', 'match'].includes(type)) {
      return res.status(400).json({ error: 'Invalid favorite type' });
    }
    
    const favorite = await authService.addToFavorites(req.user.id, type, targetId, notes);
    
    if (!favorite) {
      return res.status(500).json({ error: 'Failed to add favorite' });
    }
    
    // Track favorite event
    authService.trackEvent(
      req.user.id,
      'favorite_add',
      { type, target_id: targetId },
      req.ip,
      req.get('user-agent')
    ).catch(() => {});
    
    res.json({ success: true, favorite });
  } catch (error) {
    logger.error('Error adding favorite:', error.message);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

/**
 * @swagger
 * /api/auth/favorites/{type}/{targetId}:
 *   delete:
 *     summary: Remove from favorites
 *     description: Remove a player or match from user favorites
 *     tags: [Favorites]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [player, match]
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Favorite removed successfully
 *       401:
 *         description: Not authenticated
 */
router.delete('/favorites/:type/:targetId', authService.isAuthenticated(), async (req, res) => {
  try {
    const { type, targetId } = req.params;
    
    if (!['player', 'match'].includes(type)) {
      return res.status(400).json({ error: 'Invalid favorite type' });
    }
    
    const success = await authService.removeFromFavorites(req.user.id, type, parseInt(targetId));
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to remove favorite' });
    }
    
    // Track unfavorite event
    authService.trackEvent(
      req.user.id,
      'favorite_remove',
      { type, target_id: parseInt(targetId) },
      req.ip,
      req.get('user-agent')
    ).catch(() => {});
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error removing favorite:', error.message);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

/**
 * @swagger
 * /api/auth/settings:
 *   put:
 *     summary: Update user settings
 *     description: Update the authenticated user's settings
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *               notifications:
 *                 type: object
 *               privacy:
 *                 type: object
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       401:
 *         description: Not authenticated
 */
router.put('/settings', authService.isAuthenticated(), async (req, res) => {
  try {
    const settings = req.body;
    
    const updatedUser = await authService.updateUserSettings(req.user.id, settings);
    
    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to update settings' });
    }
    
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    logger.error('Error updating settings:', error.message);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
