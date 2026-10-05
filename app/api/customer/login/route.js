export const dynamic = 'force-dynamic';

export async function POST(req) {
  const bcrypt = await import('bcryptjs');
  const { query } = await import('@/lib/db');
  const { createCustomerToken } = await import('@/lib/customer-auth');

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await query('SELECT * FROM customers WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const customer = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, customer.password_hash);

    if (!isPasswordValid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = createCustomerToken(customer.id, customer.email);

    return Response.json({
      token,
      customer: { id: customer.id, email: customer.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
