export const dynamic = 'force-dynamic';

// Stripe checkout sessions expire after 30 minutes. Anything still pending well
// past that was abandoned at checkout and can never be paid, so it should not
// keep sitting in the fulfillment queue.
const ABANDONED_AFTER_MINUTES = 60;

async function expireAbandonedOrders(query) {
  const result = await query(
    `UPDATE orders
     SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'pending'
       AND created_at < NOW() - ($1 * INTERVAL '1 minute')
     RETURNING id`,
    [ABANDONED_AFTER_MINUTES]
  );

  if (result.rowCount > 0) {
    console.log(
      `🧹 Marked ${result.rowCount} abandoned order(s) as cancelled:`,
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
  const { query } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');

  try {
    await requireAuth(req);

    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return Response.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, orderId]
    );

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
