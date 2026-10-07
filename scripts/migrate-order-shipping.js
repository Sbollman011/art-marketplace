const pg = require('pg');
require('dotenv').config({ path: '.env.local' });

const { Pool } = pg;

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Running order shipping migration...');

    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS subtotal INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS shipping_total INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tax_total INTEGER NOT NULL DEFAULT 0
    `);

    await pool.query(`
      UPDATE orders
      SET subtotal = total
      WHERE subtotal = 0
    `);

    console.log('✅ Order shipping migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();