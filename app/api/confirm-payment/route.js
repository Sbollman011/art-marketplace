export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { query } = await import('@/lib/db');
  const { getStripe } = await import('@/lib/stripe');
  const { sendOrderEmail, sendAdminNotification } = await import('@/lib/notifications');
  
  try {
    const { sessionId, orderId } = await req.json();

    if (!sessionId || !orderId) {
      return Response.json(
        { error: 'Missing session or order ID' },
        { status: 400 }
      );
    }

    // Verify session with Stripe
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return Response.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Get order details
    const orderResult = await query(
      `SELECT o.*, json_agg(json_build_object('id', p.id, 'title', p.title, 'price', oi.price_at_purchase, 'quantity', oi.quantity)) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderResult.rows[0];

    // Update order status to paid
    const updatedResult = await query(
      'UPDATE orders SET status = $1, stripe_session_id = $2 WHERE id = $3 RETURNING *',
      ['paid', sessionId, orderId]
    );

    const updatedOrder = updatedResult.rows[0];

    // Send confirmation email
    try {
      await sendOrderEmail(order.customer_email, {
        id: orderId,
        total: order.total,
        items: order.items,
        status: 'paid',
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    // Notify admin
    try {
      await sendAdminNotification(`Order #${orderId} has been paid! Total: $${(order.total / 100).toFixed(2)}`);
    } catch (notifyError) {
      console.error('Admin notification failed:', notifyError);
    }

    return Response.json({ 
      success: true, 
      order: updatedOrder 
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
