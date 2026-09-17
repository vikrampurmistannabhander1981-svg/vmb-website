const crypto = require('crypto');

const COOKIE_NAME = 'vmb_admin';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // ৭ দিন

function secretKey() {
  return process.env.ADMIN_PASSWORD || 'dev-only-fallback-secret';
}

function sign(expiresAt) {
  const h = crypto.createHmac('sha256', secretKey()).update(String(expiresAt)).digest('hex');
  return `${expiresAt}.${h}`;
}

function makeSessionCookie() {
  const expiresAt = Date.now() + MAX_AGE_MS;
  const token = sign(expiresAt);
  const maxAgeSec = Math.floor(MAX_AGE_MS / 1000);
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSec}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

function parseCookies(header) {
  const out = {};
  (header || '').split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function isAuthed(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot === -1) return false;
  const expiresAt = Number(token.slice(0, dot));
  const sig = token.slice(dot + 1);
  if (!expiresAt || Date.now() > expiresAt) return false;
  const expected = sign(expiresAt).split('.')[1];
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

module.exports = { makeSessionCookie, clearSessionCookie, isAuthed, COOKIE_NAME };
