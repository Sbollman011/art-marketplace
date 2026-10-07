export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { query } = await import('@/lib/db');
  
  try {
    const { id } = params;
    
    const orderResult = await query(
      `SELECT o.*, json_agg(json_build_object('id', p.id, 'title', p.title, 'price', oi.price_at_purchase, 'quantity', oi.quantity)) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    return Response.json(orderResult.rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Payment confirmation happens in /api/confirm-payment, which verifies the
// Stripe Checkout session actually belongs to the order. The old PaymentIntent
// handler was removed: it accepted any succeeded payment intent for any order.

export async function PATCH(req, { params }) {
  const { query } = await import('@/lib/db');
  const { releaseOrderStock } = await import('@/lib/inventory');
  const { getStripe } = await import('@/lib/stripe');

  try {
    const { id } = params;
    const { status } = await req.json();

    if (!status) {
      return Response.json({ error: 'Status is required' }, { status: 400 });
    }

    if (status !== 'cancelled') {
      return Response.json({ error: 'Unsupported status update' }, { status: 400 });
    }

    const result = await query(
      `UPDATE orders
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return Response.json({ success: true, unchanged: true });
    }

    const cancelledOrder = result.rows[0];

    // Expire the Stripe session first. Once the artwork is back on sale, the
    // abandoned checkout must not still be payable, or it could be bought twice.
    if (cancelledOrder.stripe_session_id) {
      try {
        await getStripe().checkout.sessions.expire(cancelledOrder.stripe_session_id);
      } catch (expireError) {
        console.error('Could not expire Stripe session:', expireError.message);
      }
    }

    await releaseOrderStock(query, id);

    return Response.json({ success: true, order: cancelledOrder });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
