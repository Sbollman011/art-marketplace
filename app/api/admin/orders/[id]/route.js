export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { query } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');

  try {
    await requireAuth(req);

    const { id } = params;
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
      [id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    return Response.json(result.rows[0]);
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { query } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');
  const { releaseOrderStock } = await import('@/lib/inventory');

  try {
    await requireAuth(req);

    const { id } = params;

    // Order items cascade away with the order, so any reserved artwork has to go
    // back on sale first or it would be stranded as permanently unavailable.
    const existing = await query('SELECT status FROM orders WHERE id = $1', [id]);

    if (existing.rowCount === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (existing.rows[0].status !== 'cancelled') {
      await releaseOrderStock(query, id);
    }

    const result = await query(
      'DELETE FROM orders WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    return Response.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
}