const pg = require('pg');
require('dotenv').config({ path: '.env.local' });

const { Pool } = pg;

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Running migration: Add stripe_session_id column...');
    
    // Check if column exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='orders' AND column_name='stripe_session_id'
    `);

    if (checkResult.rows.length === 0) {
      // Column doesn't exist, add it
      await pool.query(`
        ALTER TABLE orders 
        ADD COLUMN stripe_session_id VARCHAR(255)
      `);
      console.log('✅ Added stripe_session_id column to orders table');
    } else {
      console.log('✅ stripe_session_id column already exists');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
