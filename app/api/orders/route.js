import { query } from '@/lib/db';
import { createPaymentIntent } from '@/lib/stripe';
import { sendOrderEmail, sendAdminNotification } from '@/lib/notifications';

export async function POST(req) {
  try {
    const { items, customerEmail, customerName, customerPhone } = await req.json();

    if (!items || items.length === 0 || !customerEmail || !customerName) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate total
    let total = 0;
    for (const item of items) {
      total += item.price * item.quantity;
    }

    // Create order
    const orderResult = await query(
      `INSERT INTO orders (customer_email, customer_name, customer_phone, total, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [customerEmail, customerName, customerPhone || null, total, 'pending']
    );

    const orderId = orderResult.rows[0].id;

    // Add order items
    for (const item of items) {
      await query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.id, item.quantity, item.price]
      );
    }

    // Create Stripe payment intent
    const paymentIntent = await createPaymentIntent(total, orderId);

    // Update order with payment intent ID
    await query(
      'UPDATE orders SET stripe_payment_intent_id = $1 WHERE id = $2',
      [paymentIntent.id, orderId]
    );

    // Send confirmation email
    try {
      await sendOrderEmail(customerEmail, {
        id: orderId,
        total,
        items,
        status: 'pending',
      });
    } catch (emailError) {
      console.error('Email notification failed but order created:', emailError);
    }

    // Notify admin
    try {
      await sendAdminNotification(`New order #${orderId} for $${(total / 100).toFixed(2)}`);
    } catch (notifyError) {
      console.error('Admin notification failed:', notifyError);
    }

    return Response.json({
      orderId,
      clientSecret: paymentIntent.client_secret,
      total,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
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
