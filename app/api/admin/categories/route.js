export const dynamic = 'force-dynamic';

function parseSortOrder(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : 0;
}

export async function GET(req) {
  const { query } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');

  try {
    await requireAuth(req);

    const result = await query(
      `SELECT c.*, COUNT(p.id)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.name ASC`
    );

    return Response.json(result.rows);
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const { query } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');

  try {
    await requireAuth(req);

    const { name, description, sortOrder } = await req.json();
    const trimmedName = typeof name === 'string' ? name.trim() : '';

    if (!trimmedName) {
      return Response.json({ error: 'Collection name is required' }, { status: 400 });
    }

    const existing = await query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [trimmedName]);

    if (existing.rowCount > 0) {
      return Response.json({ error: 'A collection with that name already exists' }, { status: 409 });
    }

    const result = await query(
      `INSERT INTO categories (name, description, sort_order)
       VALUES ($1, $2, $3)
       RETURNING *, 0 AS product_count`,
      [trimmedName, description?.trim() || null, parseSortOrder(sortOrder)]
    );

    return Response.json(result.rows[0]);
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Category create error:', error);
    return Response.json({ error: 'Could not create collection' }, { status: 500 });
  }
}
