export const dynamic = 'force-dynamic';

export async function POST(req) {
  const bcryptjs = await import('bcryptjs');
  const { query } = await import('@/lib/db');
  const { requireCustomerAuth } = await import('@/lib/customer-auth');

  try {
    const { customerId, email } = await requireCustomerAuth(req);
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return Response.json({ error: 'Current and new passwords are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return Response.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    const result = await query(
      'SELECT id, password_hash FROM customers WHERE id = $1 AND LOWER(email) = $2',
      [customerId, email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Account not found' }, { status: 404 });
    }

    const customer = result.rows[0];
    const validCurrentPassword = await bcryptjs.compare(currentPassword, customer.password_hash);
    if (!validCurrentPassword) {
      return Response.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const newPasswordHash = await bcryptjs.hash(newPassword, 10);
    await query(
      'UPDATE customers SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, customer.id]
    );

    return Response.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Customer password update error:', error);
    return Response.json({ error: 'Could not update password' }, { status: 500 });
  }
}