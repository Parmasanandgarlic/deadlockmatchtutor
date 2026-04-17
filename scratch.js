const http = require('http');

const req = http.request({
  host: 'localhost', port: 3001, path: '/api/analysis/run', method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let buf = '';
  res.on('data', c => buf += c);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', buf));
});
req.write(JSON.stringify({ matchId: "1' OR 1=1;--", accountId: "1' OR 1=1;--" }));
req.end();
