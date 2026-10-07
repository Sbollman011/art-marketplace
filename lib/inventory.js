/**
 * Inventory is reserved when a Stripe Checkout session is created, not when the
 * payment lands. That ordering is what prevents two buyers from both paying for
 * the same one-of-a-kind piece: the second checkout is refused up front instead
 * of being refunded afterwards.
 *
 * Every reservation is released again if the checkout is cancelled or expires.
 */

/**
 * Atomically takes stock for each item. The `stock >= quantity` guard lives in
 * the UPDATE itself, so two concurrent checkouts cannot both succeed.
 * Must be called inside a transaction.
 */
export async function reserveStockForItems(client, items) {
  for (const item of items) {
    const result = await client.query(
      `UPDATE products
       SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND stock >= $1
       RETURNING stock`,
      [item.quantity, item.id]
    );

    if (result.rowCount === 0) {
      return { ok: false, title: item.title || 'That piece' };
    }
  }

  return { ok: true };
}

/**
 * Puts an order's reserved stock back on sale. Safe to run with the pool or a
 * transaction client; callers must only invoke it when the order actually still
 * held a reservation, which the status guards upstream enforce.
 */
export async function releaseOrderStock(queryFn, orderId) {
  await queryFn(
    `UPDATE products p
     SET stock = p.stock + oi.quantity, updated_at = CURRENT_TIMESTAMP
     FROM order_items oi
     WHERE oi.order_id = $1 AND p.id = oi.product_id`,
    [orderId]
  );
}
