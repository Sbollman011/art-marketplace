const pg = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const { Pool } = pg;

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const schema = fs.readFileSync(path.join(process.cwd(), 'scripts/schema.sql'), 'utf8');
    
    console.log('Running database migrations...');
    await pool.query(schema);
    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
