export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { query } = await import('@/lib/db');
  const { getStripe } = await import('@/lib/stripe');
  const bcryptjs = await import('bcryptjs');
  const { createCustomerToken, verifyCustomerToken } = await import('@/lib/customer-auth');

  try {
    const { items, customerEmail, customerName, customerPhone, createAccount, password, shippingAddress, orderNotes, customerToken: requestCustomerToken } = await req.json();

    if (!items || items.length === 0 || !customerEmail || !customerName) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const normalizedEmail = customerEmail.toLowerCase();
    let customerToken = null;
    let createdCustomerName = customerName;
    const normalizedShippingAddress = shippingAddress?.trim() || null;
    const authenticatedCustomer = requestCustomerToken ? verifyCustomerToken(requestCustomerToken) : null;
    const authenticatedMatchesEmail = authenticatedCustomer?.email?.toLowerCase() === normalizedEmail;
    const existingCustomerResult = await query(
      `SELECT id, email, name, shipping_address
       FROM customers
       WHERE LOWER(email) = $1`,
      [normalizedEmail]
    );
    const existingCustomer = existingCustomerResult.rows[0] || null;
    let accountCustomerId = authenticatedMatchesEmail
      ? authenticatedCustomer.customerId
      : existingCustomer?.id || null;

    if (createAccount) {
      if (!existingCustomer && !authenticatedMatchesEmail) {
        if (!password || password.length < 8) {
          return Response.json(
            { error: 'Password must be at least 8 characters to create an account' },
            { status: 400 }
          );
        }

        const passwordHash = await bcryptjs.hash(password, 10);
        const customerResult = await query(
          `INSERT INTO customers (email, password_hash, name, shipping_address)
           VALUES ($1, $2, $3, $4)
           RETURNING id, email, name, shipping_address`,
          [normalizedEmail, passwordHash, customerName, normalizedShippingAddress]
        );

        const customer = customerResult.rows[0];
        customerToken = createCustomerToken(customer.id, customer.email);
        createdCustomerName = customer.name;
        accountCustomerId = customer.id;
      } else {
        createdCustomerName = existingCustomer?.name || createdCustomerName;
      }
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
      [normalizedEmail, customerName, customerPhone || null, total, 'pending', normalizedShippingAddress, orderNotes || null]
    );

    const orderId = orderResult.rows[0].id;

    if (normalizedShippingAddress && accountCustomerId) {
      await query(
        `UPDATE customers
         SET shipping_address = $1,
             name = COALESCE($2, name),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [normalizedShippingAddress, customerName || null, accountCustomerId]
      );
    }

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
      customer_email: normalizedEmail,
      // Abandoned checkouts stop being payable after 30 minutes (Stripe minimum)
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
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
      customerToken,
      customerEmail: normalizedEmail,
      customerName: createdCustomerName,
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return Response.json({ error: 'Could not start checkout' }, { status: 500 });
  }
}
