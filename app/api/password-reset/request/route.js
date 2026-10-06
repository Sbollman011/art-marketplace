export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { query } = await import('@/lib/db');
  const { createPasswordResetToken } = await import('@/lib/customer-auth');
  const { sendPasswordResetEmail } = await import('@/lib/notifications');

  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const result = await query(
      'SELECT id, email, name FROM customers WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return Response.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }

    const customer = result.rows[0];
    const token = createPasswordResetToken(customer.id, customer.email);
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;

    await sendPasswordResetEmail(customer.email, resetUrl, customer.name);

    return Response.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    return Response.json({ error: 'Could not send reset email' }, { status: 500 });
  }
}