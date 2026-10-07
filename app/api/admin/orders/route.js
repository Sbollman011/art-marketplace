export const dynamic = 'force-dynamic';

// Stripe checkout sessions expire after 30 minutes. Anything still pending well
// past that was abandoned at checkout and can never be paid, so it should not
// keep sitting in the fulfillment queue.
const ABANDONED_AFTER_MINUTES = 60;

async function expireAbandonedOrders(query) {
  const { releaseOrderStock } = await import('@/lib/inventory');

  const result = await query(
    `UPDATE orders
     SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'pending'
       AND created_at < NOW() - ($1 * INTERVAL '1 minute')
     RETURNING id`,
    [ABANDONED_AFTER_MINUTES]
  );

  // Put the reserved artwork back on sale now that the checkout is dead.
  for (const row of result.rows) {
    await releaseOrderStock(query, row.id);
  }

  if (result.rowCount > 0) {
    console.log(
      `🧹 Marked ${result.rowCount} abandoned order(s) as cancelled and returned their stock:`,
      result.rows.map((row) => row.id).join(', ')
    );
  }

  return result.rowCount;
}

export async function GET(req) {
  const { query } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');

  try {
    await requireAuth(req);

    await expireAbandonedOrders(query);

    const result = await query(
      `SELECT
         o.*,
         COUNT(oi.id) AS item_count,
         COALESCE(
           json_agg(
             json_build_object(
               'id', oi.id,
               'product_id', oi.product_id,
               'title', p.title,
               'image_url', p.image_url,
               'quantity', oi.quantity,
               'price_at_purchase', oi.price_at_purchase
             )
             ORDER BY oi.id
           ) FILTER (WHERE oi.id IS NOT NULL),
           '[]'::json
         ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    );

    return Response.json(result.rows);
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  const { query, getClient } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');
  const { releaseOrderStock, reserveStockForItems } = await import('@/lib/inventory');

  try {
    await requireAuth(req);

    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return Response.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    const previous = await query('SELECT status FROM orders WHERE id = $1', [orderId]);

    if (previous.rowCount === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const previousStatus = previous.rows[0].status;
    const wasCancelled = previousStatus === 'cancelled';
    const willCancel = status === 'cancelled';

    // Reopening a cancelled order has to take the artwork back off the shelf, and
    // it must fail loudly if the piece has since sold to someone else.
    if (wasCancelled && !willCancel) {
      const itemsResult = await query(
        `SELECT oi.product_id AS id, oi.quantity, p.title
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1`,
        [orderId]
      );

      const client = await getClient();
      let reservation = { ok: true };

      try {
        await client.query('BEGIN');
        reservation = await reserveStockForItems(client, itemsResult.rows);
        await client.query(reservation.ok ? 'COMMIT' : 'ROLLBACK');
      } catch (reserveError) {
        await client.query('ROLLBACK').catch(() => {});
        throw reserveError;
      } finally {
        client.release();
      }

      if (!reservation.ok) {
        return Response.json(
          { error: `Cannot reopen this order: "${reservation.title}" is no longer in stock.` },
          { status: 409 }
        );
      }
    }

    await query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, orderId]
    );

    // Cancelling frees the reserved artwork for the next buyer.
    if (willCancel && !wasCancelled) {
      await releaseOrderStock(query, orderId);
    }

    const result = await query(
      `SELECT
         o.*,
         COUNT(oi.id) AS item_count,
         COALESCE(
           json_agg(
             json_build_object(
               'id', oi.id,
               'product_id', oi.product_id,
               'title', p.title,
               'image_url', p.image_url,
               'quantity', oi.quantity,
               'price_at_purchase', oi.price_at_purchase
             )
             ORDER BY oi.id
           ) FILTER (WHERE oi.id IS NOT NULL),
           '[]'::json
         ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [orderId]
    );

    return Response.json(result.rows[0]);
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}
