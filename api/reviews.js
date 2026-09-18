const { sql, ensureSchema } = require('./_lib/db');
const { isAuthed } = require('./_lib/auth');

function newId() {
  return 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function clampRating(v) {
  const n = parseInt(v, 10);
  if (isNaN(n)) return 5;
  return Math.min(5, Math.max(1, n));
}

module.exports = async function handler(req, res) {
  await ensureSchema();

  const wantsAll = req.query && (req.query.all === '1');

  if (req.method === 'GET' && !wantsAll) {
    const { rows } = await sql`
      SELECT id, name, location, rating, text, sort_order, active
      FROM reviews
      WHERE active = TRUE
      ORDER BY sort_order ASC, created_at DESC
    `;
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    res.status(200).json({ reviews: rows });
    return;
  }

  if (!isAuthed(req)) {
    res.status(401).json({ error: 'লগইন প্রয়োজন।' });
    return;
  }

  if (req.method === 'GET' && wantsAll) {
    const { rows } = await sql`
      SELECT id, name, location, rating, text, sort_order, active
      FROM reviews
      ORDER BY sort_order ASC, created_at DESC
    `;
    res.status(200).json({ reviews: rows });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  if (req.method === 'POST') {
    const { name, location = '', rating = 5, text, sortOrder = 0, active = true } = body;
    if (!name || !text) {
      res.status(400).json({ error: 'নাম ও মন্তব্য আবশ্যক।' });
      return;
    }
    const id = newId();
    await sql`
      INSERT INTO reviews (id, name, location, rating, text, sort_order, active)
      VALUES (${id}, ${name}, ${location}, ${clampRating(rating)}, ${text}, ${sortOrder}, ${active})
    `;
    res.status(201).json({ ok: true, id });
    return;
  }

  if (req.method === 'PUT') {
    const { id, name, location, rating, text, sortOrder, active } = body;
    if (!id) {
      res.status(400).json({ error: 'id আবশ্যক।' });
      return;
    }
    const r = rating == null ? null : clampRating(rating);
    await sql`
      UPDATE reviews SET
        name = COALESCE(${name}, name),
        location = COALESCE(${location}, location),
        rating = COALESCE(${r}, rating),
        text = COALESCE(${text}, text),
        sort_order = COALESCE(${sortOrder}, sort_order),
        active = COALESCE(${active}, active)
      WHERE id = ${id}
    `;
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === 'DELETE') {
    const id = (req.query && req.query.id) || body.id;
    if (!id) {
      res.status(400).json({ error: 'id আবশ্যক।' });
      return;
    }
    await sql`DELETE FROM reviews WHERE id = ${id}`;
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
