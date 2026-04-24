const app = require('../server/index');

// Standardized Bridge for Vercel
// Moving back to the root api/ folder to satisfy Vercel's strict
// directory requirements for serverless functions.

// Diagnostic routes directly at the bridge level
app.get('/api/test', (req, res) => res.json({ status: 'bridge-ok', location: 'root-api', timestamp: new Date().toISOString() }));
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug', (req, res) => res.json({
    status: 'bridge-debug-active',
    location: 'root-api',
    req_path: req.path,
    req_url: req.url,
    now: new Date().toISOString()
  }));
}

module.exports = app;
