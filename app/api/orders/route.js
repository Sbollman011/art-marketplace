export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { getClient } = await import('@/lib/db');
  const { query } = await import('@/lib/db');
  const { createPaymentIntent } = await import('@/lib/stripe');
  const { sendOrderEmail, sendAdminNotification } = await import('@/lib/notifications');

  let client;

  try {
    const { items, customerEmail, customerName, customerPhone } = await req.json();

    if (!items || items.length === 0 || !customerEmail || !customerName) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    client = await getClient();
    await client.query('BEGIN');

    let total = 0;
    const orderedItems = [];

    for (const item of items) {
      const productId = parseInt(item.id, 10);
      const quantity = parseInt(item.quantity, 10);

      if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
        throw Object.assign(new Error('Invalid cart item'), { statusCode: 400 });
      }

      // Lock the row so concurrent checkouts can't oversell the same piece
      const productResult = await client.query(
        'SELECT id, title, price, stock FROM products WHERE id = $1 FOR UPDATE',
        [productId]
      );

      const product = productResult.rows[0];

      if (!product) {
        throw Object.assign(new Error('One of the items is no longer available'), {
          statusCode: 400,
        });
      }

      if (product.stock < quantity) {
        throw Object.assign(
          new Error(
            product.stock === 0
              ? `"${product.title}" is sold out`
              : `Only ${product.stock} left of "${product.title}"`
          ),
          { statusCode: 409 }
        );
      }

      // Trust the database price, never the client-supplied one
      total += product.price * quantity;
      orderedItems.push({
        id: product.id,
        title: product.title,
        price: product.price,
        quantity,
      });
    }

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (customer_email, customer_name, customer_phone, total, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [customerEmail, customerName, customerPhone || null, total, 'pending']
    );

    const orderId = orderResult.rows[0].id;

    for (const item of orderedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.id, item.quantity, item.price]
      );

      const stockResult = await client.query(
        `UPDATE products
         SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND stock >= $1
         RETURNING stock`,
        [item.quantity, item.id]
      );

      if (stockResult.rowCount === 0) {
        throw Object.assign(new Error(`"${item.title}" is sold out`), { statusCode: 409 });
      }
    }

    await client.query('COMMIT');
    client.release();
    client = null;

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
        items: orderedItems,
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
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      client.release();
    }

    console.error('Order creation error:', error);

    if (error.statusCode) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }

    return Response.json({ error: 'Could not place order' }, { status: 500 });
  }
}

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
