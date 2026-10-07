const pg = require('pg');
require('dotenv').config({ path: '.env.local' });

const { Pool } = pg;

// Depth defaults inferred from each piece's stated medium. Works on paper ship
// flat; stretched canvas ships boxed. These are starting points only - the admin
// product form is the place to correct them.
const DEPTH_DEFAULTS = [
  { id: 8, depth: 0.25, note: 'pastel on paper' },
  { id: 9, depth: 1.5, note: 'acrylic on canvas' },
  { id: 10, depth: 0.25, note: 'ink on paper' },
  { id: 11, depth: 0.25, note: 'ink on paper' },
  { id: 12, depth: 0.25, note: 'watercolor on paper' },
];

// Corrections for sizes that the 8x12 backfill got wrong, based on each piece's
// own description. Guarded so they never overwrite a manual correction.
const SIZE_CORRECTIONS = [
  { id: 9, width: 18, height: 12, note: 'description says 18" x 12"' },
  { id: 11, width: 8, height: 8, note: 'description says 8" x 8"' },
];

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Running fulfillment migration...');

    await pool.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS depth_in NUMERIC(6,2)
    `);

    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(20) NOT NULL DEFAULT 'ship'
    `);

    console.log('✅ Columns ready (products.depth_in, orders.delivery_method)');

    for (const correction of SIZE_CORRECTIONS) {
      // Only correct rows still sitting on the 8x12 backfill default.
      const result = await pool.query(
        `UPDATE products
         SET width_in = $1, height_in = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND width_in = 8 AND height_in = 12
         RETURNING title`,
        [correction.width, correction.height, correction.id]
      );

      if (result.rowCount > 0) {
        console.log(
          `   #${correction.id} "${result.rows[0].title}" -> ${correction.width}x${correction.height} (${correction.note})`
        );
      } else {
        console.log(`   #${correction.id} skipped (already edited by hand)`);
      }
    }

    for (const row of DEPTH_DEFAULTS) {
      const result = await pool.query(
        `UPDATE products
         SET depth_in = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND depth_in IS NULL
         RETURNING title`,
        [row.depth, row.id]
      );

      if (result.rowCount > 0) {
        console.log(`   #${row.id} depth ${row.depth}" (${row.note})`);
      }
    }

    console.log('✅ Fulfillment migration completed');
    console.log('   Pieces thinner than 0.5" ship flat; anything thicker ships boxed.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
