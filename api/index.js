const app = require('../server/index');

// Bridge to ensure Vercel only creates ONE serverless function
// while keeping our server logic organized in the /server directory.
console.log('[Vercel Bridge] API Express app loaded successfully');

// Diagnostic routes directly at the bridge level
app.get('/api/test', (req, res) => res.json({ status: 'bridge-ok', timestamp: new Date().toISOString() }));
app.get('/api/debug', (req, res) => res.json({ 
  status: 'bridge-debug-active', 
  req_path: req.path, 
  req_url: req.url,
  now: new Date().toISOString() 
}));

module.exports = app;
