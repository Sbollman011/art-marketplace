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

    // The session must actually belong to this order
    if (session.metadata?.orderId !== String(orderId)) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
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

    // Mark as paid. The status guard makes this idempotent, so refreshing the
    // success page cannot decrement stock twice.
    const updatedResult = await query(
      `UPDATE orders SET status = 'paid', stripe_session_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status <> 'paid'
       RETURNING *`,
      [sessionId, orderId]
    );

    const alreadyConfirmed = updatedResult.rowCount === 0;
    const updatedOrder = alreadyConfirmed ? { ...order, status: 'paid' } : updatedResult.rows[0];

    if (alreadyConfirmed) {
      return Response.json({ success: true, order: updatedOrder });
    }

    // Reduce inventory now that the money has actually cleared
    for (const item of order.items || []) {
      if (!item?.id) continue;
      await query(
        `UPDATE products
         SET stock = GREATEST(stock - $1, 0), updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [item.quantity, item.id]
      );
    }

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
    return Response.json({ error: 'Could not confirm payment' }, { status: 500 });
  }
}
