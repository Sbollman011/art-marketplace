export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { query } = await import('@/lib/db');
  const { requireCustomerAuth } = await import('@/lib/customer-auth');

  try {
    const { customerId, email } = await requireCustomerAuth(req);

    // The id comes from the signed token. Email is compared case-insensitively so
    // a token issued with different casing still resolves to the account.
    const result = await query(
      `SELECT id, email, name, shipping_address
       FROM customers
       WHERE id = $1 AND LOWER(email) = LOWER($2)`,
      [customerId, email]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customer = result.rows[0];

    return Response.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        shippingAddress: customer.shipping_address,
      },
    });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Customer profile error:', error);
    return Response.json({ error: 'Could not load customer profile' }, { status: 500 });
  }
}