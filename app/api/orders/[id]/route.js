import { query } from '@/lib/db';
import { retrievePaymentIntent } from '@/lib/stripe';
import { sendOrderSMS } from '@/lib/notifications';

export async function GET(req, { params }) {
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
