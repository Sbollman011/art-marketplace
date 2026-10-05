import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { createToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await query('SELECT * FROM admins WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const admin = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = createToken(admin.id);

    return Response.json({
      token,
      email: admin.email,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
