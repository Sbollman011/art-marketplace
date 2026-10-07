const pg = require('pg');
require('dotenv').config({ path: '.env.local' });

const { Pool } = pg;

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Running product dimensions migration...');

    await pool.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS width_in NUMERIC(6,2),
      ADD COLUMN IF NOT EXISTS height_in NUMERIC(6,2)
    `);

    // Give existing artwork the standard 8x12 canvas size so every piece has
    // real shipping data. Individual sizes can be corrected in the admin form.
    const backfill = await pool.query(`
      UPDATE products
      SET width_in = 8, height_in = 12, updated_at = CURRENT_TIMESTAMP
      WHERE width_in IS NULL AND height_in IS NULL
      RETURNING id
    `);

    console.log('✅ Product dimensions migration completed successfully');
    console.log(`   Backfilled ${backfill.rowCount} artwork item(s) to 8x12 inches.`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
