const app = require('../server/index');

// Bridge to ensure Vercel only creates ONE serverless function
// while keeping our server logic organized in the /server directory.
module.exports = app;
