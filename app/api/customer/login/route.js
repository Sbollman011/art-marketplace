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

    // Check if this email is an admin - allow them to login as customer too
    const adminResult = await query('SELECT id FROM admins WHERE email = $1', [email]);
    
    let adminId = null;
    if (adminResult.rows.length > 0) {
      adminId = adminResult.rows[0].id;
    }

    const result = await query('SELECT * FROM customers WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      // If admin but no customer record, return error
      if (adminId) {
        return Response.json(
          { error: 'This email is registered as an admin. Please use the admin login page.' },
          { status: 403 }
        );
      }
      // Regular customer doesn't exist
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const customer = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, customer.password_hash);

    if (!isPasswordValid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // If this is an admin with a customer account, also return admin token
    let adminToken = null;
    if (adminId) {
      const { createToken } = await import('@/lib/auth');
      adminToken = createToken(adminId);
    }

    const token = createCustomerToken(customer.id, customer.email);

    return Response.json({
      token,
      adminToken,
      customer: { id: customer.id, email: customer.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
