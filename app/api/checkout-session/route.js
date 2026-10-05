export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { query } = await import('@/lib/db');
  const { getStripe } = await import('@/lib/stripe');
  
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
    const lineItems = [];
    
    for (const item of items) {
      total += item.price * item.quantity;
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.title,
          },
          unit_amount: item.price, // already in cents
        },
        quantity: item.quantity,
      });
    }

    // Create order in database first
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

    // Create Stripe Checkout Session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail,
      metadata: {
        orderId: orderId.toString(),
        customerName,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/cancel?order_id=${orderId}`,
    });

    // Store session ID with order
    await query(
      'UPDATE orders SET stripe_session_id = $1 WHERE id = $2',
      [session.id, orderId]
    );

    return Response.json({ 
      sessionId: session.id,
      orderId,
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
