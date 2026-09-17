const { makeSessionCookie } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const password = (body && body.password) || '';
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    res.status(500).json({ error: 'ADMIN_PASSWORD সেট করা হয়নি (Vercel Environment Variables)।' });
    return;
  }

  if (password !== expected) {
    res.status(401).json({ error: 'পাসওয়ার্ড ভুল।' });
    return;
  }

  res.setHeader('Set-Cookie', makeSessionCookie());
  res.status(200).json({ ok: true });
};
