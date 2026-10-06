export const dynamic = 'force-dynamic';

export async function POST(req) {
  const bcryptjs = await import('bcryptjs');
  const { query } = await import('@/lib/db');
  const { verifyPasswordResetToken } = await import('@/lib/customer-auth');

  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return Response.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const payload = verifyPasswordResetToken(token);
    if (!payload) {
      return Response.json({ error: 'Reset link is invalid or has expired' }, { status: 400 });
    }

    const customerResult = await query(
      'SELECT id, email FROM customers WHERE id = $1 AND LOWER(email) = $2',
      [payload.customerId, payload.email.toLowerCase()]
    );

    if (customerResult.rows.length === 0) {
      return Response.json({ error: 'Reset link is invalid or has expired' }, { status: 400 });
    }

    const passwordHash = await bcryptjs.hash(password, 10);
    await query(
      'UPDATE customers SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, payload.customerId]
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    return Response.json({ error: 'Could not reset password' }, { status: 500 });
  }
}