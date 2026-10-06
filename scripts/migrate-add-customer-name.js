const pg = require('pg');
require('dotenv').config({ path: '.env.local' });

const { Pool } = pg;

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Adding name column to customers table...');
    await pool.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS name VARCHAR(255)');
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
