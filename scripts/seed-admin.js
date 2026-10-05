const bcrypt = require('bcryptjs');
const pg = require('pg');
require('dotenv').config({ path: '.env.local' });

const { Pool } = pg;

async function seedAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.argv[2] || 'changeme123';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    await pool.query(
      'INSERT INTO admins (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET password_hash = $2',
      [adminEmail, passwordHash]
    );

    console.log(`✅ Admin created: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('   ⚠️  Change this password immediately in production!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedAdmin();
