const pg = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const { Pool } = pg;

async function addAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.argv[2];

    if (!password) {
      console.log('❌ Usage: node scripts/add-admin.js <password> <email_optional>');
      console.log('❌ Example: node scripts/add-admin.js mypassword123 gabriel@example.com');
      process.exit(1);
    }

    // Optional: Accept email as 3rd argument
    const adminEmail = process.argv[3] || email;

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO admins (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email`,
      [adminEmail, passwordHash]
    );

    console.log('✅ Admin created:', result.rows[0].email);
    console.log('   Password: (hidden)');
    console.log('   ⚠️  Change this password immediately in production!');
  } catch (error) {
    if (error.message.includes('duplicate')) {
      console.error('❌ Admin with this email already exists');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }

  async function query(text, params) {
    return pool.query(text, params);
  }
}

addAdmin();
