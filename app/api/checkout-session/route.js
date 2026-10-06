export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { query } = await import('@/lib/db');
  const { getStripe } = await import('@/lib/stripe');

  try {
    const { items, customerEmail, customerName, customerPhone, shippingAddress, orderNotes } = await req.json();

    if (!items || items.length === 0 || !customerEmail || !customerName) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Price and availability come from the database, never from the client
    let total = 0;
    const lineItems = [];
    const orderedItems = [];

    for (const item of items) {
      const productId = parseInt(item.id, 10);
      const quantity = parseInt(item.quantity, 10);

      if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
        return Response.json({ error: 'Invalid cart item' }, { status: 400 });
      }

      const productResult = await query(
        'SELECT id, title, price, stock, image_url FROM products WHERE id = $1',
        [productId]
      );
      const product = productResult.rows[0];

      if (!product) {
        return Response.json(
          { error: 'One of the items is no longer available' },
          { status: 400 }
        );
      }

      if (product.stock < quantity) {
        return Response.json(
          {
            error:
              product.stock === 0
                ? `"${product.title}" is sold out`
                : `Only ${product.stock} left of "${product.title}"`,
          },
          { status: 409 }
        );
      }

      total += product.price * quantity;
      orderedItems.push({ id: product.id, price: product.price, quantity });
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.title,
            ...(product.image_url ? { images: [product.image_url] } : {}),
          },
          unit_amount: product.price, // already in cents
        },
        quantity,
      });
    }

    // Create order in database first with shipping and notes
    const orderResult = await query(
      `INSERT INTO orders (customer_email, customer_name, customer_phone, total, status, shipping_address, order_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [customerEmail, customerName, customerPhone || null, total, 'pending', shippingAddress || null, orderNotes || null]
    );

    const orderId = orderResult.rows[0].id;

    // Add order items
    for (const item of orderedItems) {
      await query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.id, item.quantity, item.price]
      );
    }

    // Create Stripe Checkout Session
    const stripe = getStripe();
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail,
      metadata: {
        orderId: orderId.toString(),
        customerName,
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${origin}/cancel?order_id=${orderId}`,
    });

    // Store session ID with order
    await query(
      'UPDATE orders SET stripe_session_id = $1 WHERE id = $2',
      [session.id, orderId]
    );

    return Response.json({
      sessionId: session.id,
      url: session.url,
      orderId,
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return Response.json({ error: 'Could not start checkout' }, { status: 500 });
  }
}
