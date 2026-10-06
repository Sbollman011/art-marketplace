export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  const { query } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');

  try {
    await requireAuth(req);

    const id = parseInt(params.id, 10);
    if (!Number.isInteger(id)) {
      return Response.json({ error: 'Invalid product id' }, { status: 400 });
    }

    const { title, description, price, imageUrl, stock } = await req.json();

    if (!title || price === undefined || price === null) {
      return Response.json(
        { error: 'Title and price are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE products
       SET title = $1, description = $2, price = $3, image_url = $4, stock = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [title, description || null, price, imageUrl || null, stock ?? 0, id]
    );

    if (result.rowCount === 0) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    return Response.json(result.rows[0]);
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Product update error:', error);
    return Response.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { query } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');

  try {
    await requireAuth(req);

    const id = parseInt(params.id, 10);
    if (!Number.isInteger(id)) {
      return Response.json({ error: 'Invalid product id' }, { status: 400 });
    }

    const ordered = await query(
      'SELECT 1 FROM order_items WHERE product_id = $1 LIMIT 1',
      [id]
    );

    if (ordered.rowCount > 0) {
      return Response.json(
        {
          error:
            'This artwork appears in existing orders and cannot be deleted. Set its stock to 0 to remove it from the store.',
        },
        { status: 409 }
      );
    }

    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

    if (result.rowCount === 0) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Product delete error:', error);
    return Response.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
