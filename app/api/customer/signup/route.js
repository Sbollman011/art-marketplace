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

    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingResult = await query('SELECT id FROM customers WHERE email = $1', [email]);
    
    if (existingResult.rows.length > 0) {
      return Response.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password and create customer
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO customers (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email`,
      [email, passwordHash]
    );

    const customer = result.rows[0];
    const token = createCustomerToken(customer.id, email);

    return Response.json({
      token,
      customer: { id: customer.id, email: customer.email },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
