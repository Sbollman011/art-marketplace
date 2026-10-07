export const dynamic = 'force-dynamic';

/**
 * Live pricing preview for the checkout form.
 * Prices and dimensions always come from the database, so this endpoint can be
 * called freely without letting the client influence totals.
 */
export async function POST(req) {
  const { query } = await import('@/lib/db');
  const { calculateOrderTotals } = await import('@/lib/pricing');

  try {
    const { items, shippingAddress, deliveryMethod } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'No items to quote' }, { status: 400 });
    }

    const quantityByProductId = new Map();

    for (const item of items) {
      const productId = Number.parseInt(item?.id, 10);
      const quantity = Number.parseInt(item?.quantity, 10);

      if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
        return Response.json({ error: 'Invalid cart item' }, { status: 400 });
      }

      quantityByProductId.set(productId, (quantityByProductId.get(productId) || 0) + quantity);
    }

    const productResult = await query(
      'SELECT id, price, width_in, height_in, depth_in FROM products WHERE id = ANY($1::int[])',
      [[...quantityByProductId.keys()]]
    );

    if (productResult.rowCount !== quantityByProductId.size) {
      return Response.json({ error: 'One of the items is no longer available' }, { status: 400 });
    }

    const pricedItems = productResult.rows.map((product) => ({
      price: product.price,
      quantity: quantityByProductId.get(product.id),
      width_in: product.width_in,
      height_in: product.height_in,
      depth_in: product.depth_in,
    }));

    const totals = calculateOrderTotals(pricedItems, shippingAddress || '', deliveryMethod);

    return Response.json({
      subtotal: totals.subtotal,
      shipping: totals.shippingTotal,
      // Sales tax is calculated by Stripe Tax on the payment page.
      total: totals.total,
      isPickup: totals.isPickup,
      destinationState: totals.destination.state,
      hasDestination: Boolean(totals.destination.state || totals.destination.postalCode),
    });
  } catch (error) {
    console.error('Quote error:', error);
    return Response.json({ error: 'Could not calculate totals' }, { status: 500 });
  }
}
