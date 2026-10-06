import { query } from './lib/db.js';

const sql = 'ALTER TABLE customers ADD COLUMN IF NOT EXISTS name VARCHAR(255)';

try {
  const result = await query(sql);
  console.log('Migration complete: Added name column to customers table');
  process.exit(0);
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
}
