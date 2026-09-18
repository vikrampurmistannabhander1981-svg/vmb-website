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
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC;`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'কেজি';`;
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      location    TEXT,
      rating      INTEGER NOT NULL DEFAULT 5,
      text        TEXT NOT NULL,
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
  await sql`ALTER TABLE site_branches ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;`;
  await sql`ALTER TABLE site_branches ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;`;
  await sql`ALTER TABLE site_branches ADD COLUMN IF NOT EXISTS open_time TEXT;`;
  await sql`ALTER TABLE site_branches ADD COLUMN IF NOT EXISTS close_time TEXT;`;
  await seedDefaultProducts();
  schemaReady = true;
}

// সাইটের আদি ৬টা মিষ্টি একবারই ডাটাবেজে ঢোকে, যাতে অ্যাডমিন থেকে এডিট/ডিলিট করা যায়।
// একবার ঢুকলে (বা মালিক ডিলিট করলে) আর ফিরে আসে না — site_settings-এ ফ্ল্যাগ রাখা হয়।
async function seedDefaultProducts() {
  const { rows } = await sql`SELECT value FROM site_settings WHERE key = 'seeded_products'`;
  if (rows.length) return;

  const seeds = [
    ['seed_kanchagolla', 'কাঁচাগোল্লা', 'নারকেল মিষ্টি', 'normal', 'খাঁটি ছানা আর নারকেল দিয়ে তৈরি নরম, রসালো কাঁচাগোল্লা — বিক্রমপুরের ঐতিহ্যবাহী পদ্ধতিতে তৈরি।', '/assets/img/kanchagolla.jpg', 1],
    ['seed_khirsha', 'ক্ষীরসা', 'ঐতিহ্যবাহী', 'special', 'মাটির পাত্রে ধীরে জ্বাল দেওয়া ঘন দুধের বিক্রমপুরের বিখ্যাত ক্ষীরসা — খাঁটি স্বাদের প্রতিচ্ছবি।', '/assets/img/khirsha.jpg', 2],
    ['seed_jilapi', 'জিলাপি', 'গরম-গরম', 'special', 'কুড়মুড়ে আর রসে ভেজা, প্রতিদিন তাজা ভাজা জিলাপি — বিকেলের নাস্তায় ভরসার সঙ্গী।', '/assets/img/jilapi.jpg', 3],
    ['seed_sondesh', 'সন্দেশ', 'সিগনেচার', 'sondesh', 'ছাঁচে গড়া নিখুঁত ছানার সন্দেশ, একাধিক রঙ ও স্বাদে — উৎসব-অনুষ্ঠানের প্রথম পছন্দ।', '/assets/img/sondesh.jpg', 4],
    ['seed_chomchom', 'চমচম', 'ক্লাসিক', 'normal', 'পেস্তা-বাদাম দেওয়া নরম ছানার চমচম, খাঁটি স্বাদে ভরপুর — বাঙালির চিরচেনা প্রিয় মিষ্টি।', '/assets/img/chomchom.jpg', 5],
    ['seed_laddu', 'লাড্ডু', 'উৎসব স্পেশাল', 'laddu', 'বেসন আর খাঁটি ঘি দিয়ে তৈরি ঝুরঝুরে, সুগন্ধি লাড্ডু — উপহার দেওয়ার জন্য আদর্শ।', '/assets/img/laddu.jpg', 6]
  ];
  for (const [id, title, subtitle, category, description, image, order] of seeds) {
    await sql`
      INSERT INTO products (id, title, subtitle, category, description, image_url, sort_order, active, featured)
      VALUES (${id}, ${title}, ${subtitle}, ${category}, ${description}, ${image}, ${order}, TRUE, TRUE)
      ON CONFLICT (id) DO NOTHING
    `;
  }
  await sql`INSERT INTO site_settings (key, value) VALUES ('seeded_products', '1') ON CONFLICT (key) DO NOTHING`;
}

module.exports = { sql, ensureSchema };
