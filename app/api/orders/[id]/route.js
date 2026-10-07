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

export async function POST(req, { params }) {
  const { query } = await import('@/lib/db');
  const { retrievePaymentIntent } = await import('@/lib/stripe');
  const { sendOrderSMS } = await import('@/lib/notifications');
  
  try {
    const { id } = params;
    const { paymentIntentId } = await req.json();

    // Verify payment with Stripe
    const paymentIntent = await retrievePaymentIntent(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return Response.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Update order status
    const result = await query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      ['paid', id]
    );

    // Send SMS notification if phone provided
    if (result.rows[0].customer_phone) {
      try {
        await sendOrderSMS(
          result.rows[0].customer_phone,
          id,
          result.rows[0].total
        );
      } catch (smsError) {
        console.error('SMS notification failed:', smsError);
      }
    }

    return Response.json({ success: true, order: result.rows[0] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const { query } = await import('@/lib/db');

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

    return Response.json({ success: true, order: result.rows[0] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
