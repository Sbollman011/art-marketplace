export const dynamic = 'force-dynamic';

// Order creation lives in /api/checkout-session, which runs through Stripe
// Checkout so Stripe Tax can calculate sales tax. The old PaymentIntent based
// POST handler was removed because it bypassed that tax calculation.

export async function GET(req) {
  const { query } = await import('@/lib/db');

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const result = await query(
      `SELECT o.*, json_agg(json_build_object('id', p.id, 'title', p.title, 'price', oi.price_at_purchase, 'quantity', oi.quantity)) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.customer_email = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [email]
    );

    return Response.json(result.rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
