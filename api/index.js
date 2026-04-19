const app = require('../server/index');

// Bridge to ensure Vercel only creates ONE serverless function
// while keeping our server logic organized in the /server directory.
console.log('[Vercel Bridge] API Express app loaded successfully');
module.exports = app;
