const crypto = require('crypto');

const TOKEN_VERSION = 'v1';
const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60;

function getSecret() {
  const secret = process.env.SHARE_TOKEN_SECRET || process.env.CSRF_SECRET || process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SHARE_TOKEN_SECRET, CSRF_SECRET, or SESSION_SECRET is required in production.');
  }
  return 'deadlock-aftermatch-development-share-secret';
}

function base64urlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function parseBase64urlJson(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function sign(payload) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url');
}

function createShareToken(matchId, accountId, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const payload = base64urlJson({
    v: TOKEN_VERSION,
    m: Number(matchId),
    a: Number(accountId),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  });
  return `${payload}.${sign(payload)}`;
}

function verifyShareToken(token, matchId, accountId) {
  if (typeof token !== 'string') return false;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return false;

  let parsed;
  try {
    parsed = parseBase64urlJson(payload);
  } catch {
    return false;
  }

  return (
    parsed?.v === TOKEN_VERSION &&
    Number(parsed.m) === Number(matchId) &&
    Number(parsed.a) === Number(accountId) &&
    Number(parsed.exp) >= Math.floor(Date.now() / 1000)
  );
}

module.exports = {
  createShareToken,
  verifyShareToken,
  DEFAULT_TTL_SECONDS,
};
