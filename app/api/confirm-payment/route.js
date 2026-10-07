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

    // Stripe Tax calculates the real tax during checkout, so the stored totals
    // are reconciled from what the customer was actually charged.
    const taxTotal = session.total_details?.amount_tax ?? 0;
    const chargedTotal = session.amount_total ?? order.total;

    // Mark as paid. The status guard makes this idempotent, so refreshing the
    // success page cannot decrement stock twice.
    const updatedResult = await query(
      `UPDATE orders
       SET status = 'paid', stripe_session_id = $1, tax_total = $2, total = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND status <> 'paid'
       RETURNING *`,
      [sessionId, taxTotal, chargedTotal, orderId]
    );

    const alreadyConfirmed = updatedResult.rowCount === 0;
    const updatedOrder = alreadyConfirmed
      ? { ...order, status: 'paid' }
      : { ...updatedResult.rows[0], items: order.items };

    if (alreadyConfirmed) {
      return Response.json({ success: true, order: updatedOrder });
    }

    // Stock was already reserved when the checkout session was created, so there
    // is nothing to decrement here. The only way an order reaches payment without
    // holding its reservation is if it was cancelled first, so re-take it and
    // speak up if the piece is genuinely gone rather than overselling silently.
    if (order.status === 'cancelled') {
      const { getClient } = await import('@/lib/db');
      const { reserveStockForItems } = await import('@/lib/inventory');
      const reservableItems = (order.items || [])
        .filter((item) => item?.id)
        .map((item) => ({ id: item.id, quantity: item.quantity, title: item.title }));

      const client = await getClient();
      let recovered = false;

      try {
        await client.query('BEGIN');
        const reservation = await reserveStockForItems(client, reservableItems);
        recovered = reservation.ok;
        await client.query(reservation.ok ? 'COMMIT' : 'ROLLBACK');
      } catch (reserveError) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Could not re-reserve stock for paid order:', reserveError);
      } finally {
        client.release();
      }

      if (!recovered) {
        console.error(`Order #${orderId} was paid but its artwork is no longer available.`);
        try {
          await sendAdminNotification(
            `Order #${orderId} was paid after being cancelled, and the artwork is no longer in stock. This one needs a refund or a conversation with the buyer.`,
            { ...order, id: orderId, status: 'paid' }
          );
        } catch (notifyError) {
          console.error('Could not alert admins about the oversold order:', notifyError);
        }
      }
    }

    // Send confirmation email
    try {
      await sendOrderEmail(updatedOrder.customer_email, {
        id: orderId,
        subtotal: updatedOrder.subtotal,
        shipping_total: updatedOrder.shipping_total,
        tax_total: updatedOrder.tax_total,
        total: updatedOrder.total,
        items: updatedOrder.items,
        delivery_method: updatedOrder.delivery_method,
        status: 'paid',
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    // Notify admin
    try {
      await sendAdminNotification(
        `Order #${orderId} has been paid! Total: $${(updatedOrder.total / 100).toFixed(2)}`,
        { ...updatedOrder, id: orderId, status: 'paid' }
      );
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
