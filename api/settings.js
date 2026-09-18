const { sql, ensureSchema } = require('./_lib/db');
const { isAuthed } = require('./_lib/auth');

const ALLOWED_KEYS = [
  'phone', 'email', 'address',
  'topbar_1', 'topbar_2', 'topbar_3',
  'facebook', 'instagram', 'whatsapp',
  'about_intro', 'about_history', 'credit',
  'hours_open', 'hours_close', 'hours_note'
];

module.exports = async function handler(req, res) {
  await ensureSchema();

  if (req.method === 'GET') {
    const { rows } = await sql`SELECT key, value FROM site_settings`;
    const out = {};
    rows.forEach((r) => { out[r.key] = r.value; });
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    res.status(200).json({ settings: out });
    return;
  }

  if (!isAuthed(req)) {
    res.status(401).json({ error: 'লগইন প্রয়োজন।' });
    return;
  }

  if (req.method === 'PUT') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const settings = (body && body.settings) || {};
    for (const key of Object.keys(settings)) {
      if (!ALLOWED_KEYS.includes(key)) continue;
      const value = settings[key] == null ? '' : String(settings[key]);
      await sql`
        INSERT INTO site_settings (key, value) VALUES (${key}, ${value})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
