export const dynamic = 'force-dynamic';

function parseSortOrder(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : 0;
}

export async function PATCH(req, { params }) {
  const { query } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');

  try {
    await requireAuth(req);

    const id = Number.parseInt(params.id, 10);

    if (!Number.isInteger(id)) {
      return Response.json({ error: 'Invalid collection id' }, { status: 400 });
    }

    const { name, description, sortOrder } = await req.json();
    const trimmedName = typeof name === 'string' ? name.trim() : '';

    if (!trimmedName) {
      return Response.json({ error: 'Collection name is required' }, { status: 400 });
    }

    const clash = await query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id <> $2',
      [trimmedName, id]
    );

    if (clash.rowCount > 0) {
      return Response.json({ error: 'A collection with that name already exists' }, { status: 409 });
    }

    const result = await query(
      `UPDATE categories
       SET name = $1, description = $2, sort_order = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [trimmedName, description?.trim() || null, parseSortOrder(sortOrder), id]
    );

    if (result.rowCount === 0) {
      return Response.json({ error: 'Collection not found' }, { status: 404 });
    }

    return Response.json(result.rows[0]);
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Category update error:', error);
    return Response.json({ error: 'Could not update collection' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { query } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');

  try {
    await requireAuth(req);

    const id = Number.parseInt(params.id, 10);

    if (!Number.isInteger(id)) {
      return Response.json({ error: 'Invalid collection id' }, { status: 400 });
    }

    // Artwork is never deleted with a collection; the reference just clears.
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);

    if (result.rowCount === 0) {
      return Response.json({ error: 'Collection not found' }, { status: 404 });
    }

    return Response.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Category delete error:', error);
    return Response.json({ error: 'Could not delete collection' }, { status: 500 });
  }
}
