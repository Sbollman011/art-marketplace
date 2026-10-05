export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { query } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');

  try {
    await requireAuth(req);

    const result = await query(
      'SELECT id, email, created_at FROM admins ORDER BY created_at DESC'
    );

    return Response.json(result.rows);
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const bcrypt = await import('bcryptjs');
  const { query } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');

  try {
    await requireAuth(req);

    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO admins (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [email, passwordHash]
    );

    return Response.json(result.rows[0]);
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message.includes('duplicate')) {
      return Response.json({ error: 'Email already exists' }, { status: 400 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const { query } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');

  try {
    await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('id');

    if (!adminId) {
      return Response.json({ error: 'Admin ID required' }, { status: 400 });
    }

    await query('DELETE FROM admins WHERE id = $1', [adminId]);

    return Response.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}
