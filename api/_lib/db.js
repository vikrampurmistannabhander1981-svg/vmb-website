const { sql } = require('@vercel/postgres');

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      subtitle    TEXT,
      category    TEXT NOT NULL DEFAULT 'normal',
      description TEXT,
      image_url   TEXT,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      active      BOOLEAN NOT NULL DEFAULT TRUE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS site_branches (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      area        TEXT,
      address     TEXT,
      phone       TEXT,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      active      BOOLEAN NOT NULL DEFAULT TRUE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  schemaReady = true;
}

module.exports = { sql, ensureSchema };
