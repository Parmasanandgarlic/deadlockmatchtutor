const app = require('../../server/index');

// Internalized Bridge for Vercel
// This file is placed inside the client directory to satisfy Vercel's
// native expectation for an "api" folder inside the build root.
console.log('[Vercel Internal Bridge] API Express app loaded');

// Diagnostic routes directly at the bridge level
app.get('/api/test', (req, res) => res.json({ status: 'bridge-ok', location: 'client-api', timestamp: new Date().toISOString() }));
app.get('/api/debug', (req, res) => res.json({ 
  status: 'bridge-debug-active', 
  location: 'client-api',
  req_path: req.path, 
  req_url: req.url,
  now: new Date().toISOString() 
}));

module.exports = app;
