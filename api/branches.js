const { sql, ensureSchema } = require('./_lib/db');
const { isAuthed } = require('./_lib/auth');

function newId() {
  return 'b_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

module.exports = async function handler(req, res) {
  await ensureSchema();

  const wantsAll = req.query && (req.query.all === '1');

  if (req.method === 'GET' && !wantsAll) {
    const { rows } = await sql`
      SELECT id, name, area, address, phone, sort_order, active
      FROM site_branches
      WHERE active = TRUE
      ORDER BY sort_order ASC, created_at ASC
    `;
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    res.status(200).json({ branches: rows });
    return;
  }

  if (!isAuthed(req)) {
    res.status(401).json({ error: 'লগইন প্রয়োজন।' });
    return;
  }

  if (req.method === 'GET' && wantsAll) {
    const { rows } = await sql`
      SELECT id, name, area, address, phone, sort_order, active
      FROM site_branches
      ORDER BY sort_order ASC, created_at ASC
    `;
    res.status(200).json({ branches: rows });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  if (req.method === 'POST') {
    const id = newId();
    const { name, area = '', address = '', phone = '', sortOrder = 0, active = true } = body;
    if (!name) {
      res.status(400).json({ error: 'নাম (name) আবশ্যক।' });
      return;
    }
    await sql`
      INSERT INTO site_branches (id, name, area, address, phone, sort_order, active)
      VALUES (${id}, ${name}, ${area}, ${address}, ${phone}, ${sortOrder}, ${active})
    `;
    res.status(201).json({ ok: true, id });
    return;
  }

  if (req.method === 'PUT') {
    const { id, name, area, address, phone, sortOrder, active } = body;
    if (!id) {
      res.status(400).json({ error: 'id আবশ্যক।' });
      return;
    }
    await sql`
      UPDATE site_branches SET
        name = COALESCE(${name}, name),
        area = COALESCE(${area}, area),
        address = COALESCE(${address}, address),
        phone = COALESCE(${phone}, phone),
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
    await sql`DELETE FROM site_branches WHERE id = ${id}`;
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
