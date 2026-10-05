export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { query } = await import('@/lib/db');
  const { requireCustomerAuth } = await import('@/lib/customer-auth');

  try {
    const { customerId, email } = await requireCustomerAuth(req);

    // Get all orders for this customer email
    const result = await query(
      `SELECT o.*, json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 'title', p.title, 'quantity', oi.quantity, 'price_at_purchase', oi.price_at_purchase)) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.customer_email = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [email]
    );

    return Response.json({ orders: result.rows });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Customer orders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
