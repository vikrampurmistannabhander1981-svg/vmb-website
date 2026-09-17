const { sql, ensureSchema } = require('./_lib/db');
const { isAuthed } = require('./_lib/auth');

function newId() {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

module.exports = async function handler(req, res) {
  await ensureSchema();

  const wantsAll = req.query && (req.query.all === '1');

  if (req.method === 'GET' && !wantsAll) {
    const { rows } = await sql`
      SELECT id, title, subtitle, category, description, image_url, sort_order, active
      FROM products
      WHERE active = TRUE
      ORDER BY sort_order ASC, created_at ASC
    `;
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    res.status(200).json({ products: rows });
    return;
  }

  if (!isAuthed(req)) {
    res.status(401).json({ error: 'লগইন প্রয়োজন।' });
    return;
  }

  if (req.method === 'GET' && wantsAll) {
    const { rows } = await sql`
      SELECT id, title, subtitle, category, description, image_url, sort_order, active
      FROM products
      ORDER BY sort_order ASC, created_at ASC
    `;
    res.status(200).json({ products: rows });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  if (req.method === 'POST') {
    const id = newId();
    const {
      title, subtitle = '', category = 'normal', description = '',
      imageUrl = '', sortOrder = 0, active = true
    } = body;
    if (!title) {
      res.status(400).json({ error: 'নাম (title) আবশ্যক।' });
      return;
    }
    await sql`
      INSERT INTO products (id, title, subtitle, category, description, image_url, sort_order, active)
      VALUES (${id}, ${title}, ${subtitle}, ${category}, ${description}, ${imageUrl}, ${sortOrder}, ${active})
    `;
    res.status(201).json({ ok: true, id });
    return;
  }

  if (req.method === 'PUT') {
    const { id, title, subtitle, category, description, imageUrl, sortOrder, active } = body;
    if (!id) {
      res.status(400).json({ error: 'id আবশ্যক।' });
      return;
    }
    await sql`
      UPDATE products SET
        title = COALESCE(${title}, title),
        subtitle = COALESCE(${subtitle}, subtitle),
        category = COALESCE(${category}, category),
        description = COALESCE(${description}, description),
        image_url = COALESCE(${imageUrl}, image_url),
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
    await sql`DELETE FROM products WHERE id = ${id}`;
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
