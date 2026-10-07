export const dynamic = 'force-dynamic';

// Pickup orders are sourced to the studio for sales tax, not to the buyer.
// Set PICKUP_POSTAL_CODE to the studio's real ZIP: Washington rates vary by city.
const PICKUP_POSTAL_CODE = process.env.PICKUP_POSTAL_CODE || '98101';

export async function POST(req) {
  const { query, getClient } = await import('@/lib/db');
  const { getStripe } = await import('@/lib/stripe');
  const bcryptjs = await import('bcryptjs');
  const { createCustomerToken, verifyCustomerToken } = await import('@/lib/customer-auth');
  const { calculateOrderTotals } = await import('@/lib/pricing');
  const { verifyShippingAddress } = await import('@/lib/address-verify');
  const { reserveStockForItems, releaseOrderStock } = await import('@/lib/inventory');

  try {
    const { items, customerEmail, customerName, customerPhone, createAccount, password, shippingAddress, orderNotes, deliveryMethod, customerToken: requestCustomerToken } = await req.json();

    if (!items || items.length === 0 || !customerEmail || !customerName) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const isPickup = deliveryMethod === 'pickup';
    const normalizedShippingAddress = isPickup ? null : shippingAddress?.trim();

    if (!isPickup && !normalizedShippingAddress) {
      return Response.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    const shippingVerification = isPickup
      ? {
          verified: true,
          confirmed: true,
          status: 'pickup',
          message: 'Pickup orders do not need shipping verification.',
          standardizedAddress: null,
          parsed: { country: 'US', state: null, postalCode: null, isComplete: true },
        }
      : await verifyShippingAddress(normalizedShippingAddress || '');

    if (!isPickup && !shippingVerification.verified) {
      return Response.json(
        { error: shippingVerification.message || 'We could not verify this shipping address.' },
        { status: 400 }
      );
    }

    const destination = shippingVerification.parsed;
    // The fallback checker is advisory, so only an authoritative result is
    // allowed to rewrite the address the shopper actually typed.
    const shippingAddressForStorage = isPickup
      ? null
      : (shippingVerification.confirmed && shippingVerification.standardizedAddress)
        || normalizedShippingAddress;

    const normalizedEmail = customerEmail.toLowerCase();
    let customerToken = null;
    let createdCustomerName = customerName;
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
          [normalizedEmail, passwordHash, customerName, shippingAddressForStorage]
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
    const lineItems = [];
    const orderedItems = [];

    for (const item of items) {
      const productId = parseInt(item.id, 10);
      const quantity = parseInt(item.quantity, 10);

      if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
        return Response.json({ error: 'Invalid cart item' }, { status: 400 });
      }

      const productResult = await query(
        'SELECT id, title, price, stock, image_url, width_in, height_in, depth_in FROM products WHERE id = $1',
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

      orderedItems.push({
        id: product.id,
        title: product.title,
        price: product.price,
        quantity,
        width_in: product.width_in,
        height_in: product.height_in,
        depth_in: product.depth_in,
      });
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.title,
            ...(product.image_url ? { images: [product.image_url] } : {}),
          },
          unit_amount: product.price, // already in cents
          tax_behavior: 'exclusive',
        },
        quantity,
      });
    }

    const { subtotal, shippingTotal, total } = calculateOrderTotals(
      orderedItems,
      shippingAddressForStorage || '',
      deliveryMethod
    );

    if (shippingTotal > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping from Seattle, WA',
            // Lets Stripe apply each state's own rule on taxing delivery charges.
            tax_code: 'txcd_92010001',
          },
          unit_amount: shippingTotal,
          tax_behavior: 'exclusive',
        },
        quantity: 1,
      });
    }

    // Reserve the stock and record the order in one transaction. Holding the
    // piece here, rather than at payment, is what stops two buyers from paying
    // for the same original. tax_total stays 0 until Stripe Tax reports it.
    const client = await getClient();
    let orderId;

    try {
      await client.query('BEGIN');

      const reservation = await reserveStockForItems(client, orderedItems);

      if (!reservation.ok) {
        await client.query('ROLLBACK');
        return Response.json(
          { error: `"${reservation.title}" was just purchased by someone else.` },
          { status: 409 }
        );
      }

      const orderResult = await client.query(
        `INSERT INTO orders (customer_email, customer_name, customer_phone, subtotal, shipping_total, tax_total, total, status, shipping_address, order_notes, delivery_method)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [normalizedEmail, customerName, customerPhone || null, subtotal, shippingTotal, 0, total, 'pending', shippingAddressForStorage, orderNotes || null, isPickup ? 'pickup' : 'ship']
      );

      orderId = orderResult.rows[0].id;

      for (const item of orderedItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
           VALUES ($1, $2, $3, $4)`,
          [orderId, item.id, item.quantity, item.price]
        );
      }

      await client.query('COMMIT');
    } catch (transactionError) {
      await client.query('ROLLBACK').catch(() => {});
      throw transactionError;
    } finally {
      client.release();
    }

    if (shippingAddressForStorage && accountCustomerId) {
      await query(
        `UPDATE customers
         SET shipping_address = $1,
             name = COALESCE($2, name),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [shippingAddressForStorage, customerName || null, accountCustomerId]
      );
    }

    // Create Stripe Checkout Session
    const stripe = getStripe();
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Stripe Tax reads the rate from the customer's address, so the address the
    // shopper already gave us is attached to a Stripe customer before checkout
    // opens. That avoids making them type the address a second time.
    // Pickup is sourced to the studio, which is where the sale actually happens.
    const stripeAddress = isPickup
      ? { country: 'US', state: 'WA', postal_code: PICKUP_POSTAL_CODE }
      : {
          country: 'US',
          postal_code: destination.postalCode,
          ...(destination.state ? { state: destination.state } : {}),
        };

    let session;

    try {
      const existingStripeCustomers = await stripe.customers.list({ email: normalizedEmail, limit: 1 });
      const stripeCustomer = existingStripeCustomers.data[0]
        ? await stripe.customers.update(existingStripeCustomers.data[0].id, {
            name: customerName,
            address: stripeAddress,
          })
        : await stripe.customers.create({
            email: normalizedEmail,
            name: customerName,
            address: stripeAddress,
          });

      session = await stripe.checkout.sessions.create({
      // --- Configured in Stripe Checkout Studio ---
      // ui_mode is 'hosted' because stripe-node here is 13.10.0. 'hosted_page'
      // requires Stripe API version 2026-03-25 or newer and is rejected today.
      ui_mode: 'hosted',
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: true },
      allow_promotion_codes: false,
      submit_type: 'auto',
      origin_context: 'web',
      // payment_method_collection is intentionally omitted: Stripe only accepts
      // it for recurring prices, and this store sells one-time pieces.
      // --- Application behaviour, not Studio-configured ---
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      // Carries the shipping address that Stripe Tax uses to pick the rate.
      customer: stripeCustomer.id,
      // Abandoned checkouts stop being payable after 30 minutes (Stripe minimum)
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      // confirm-payment verifies this orderId before marking the order paid.
      metadata: {
        orderId: orderId.toString(),
        customerName,
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${origin}/cancel?order_id=${orderId}`,
      });
    } catch (stripeError) {
      // A reservation must never outlive a checkout that failed to open, or the
      // piece would sit unsellable until the abandoned-order sweep.
      await releaseOrderStock(query, orderId);
      await query(
        `UPDATE orders
         SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'pending'`,
        [orderId]
      );
      throw stripeError;
    }

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
