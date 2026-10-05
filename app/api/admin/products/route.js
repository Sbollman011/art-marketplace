export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { query } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');

  try {
    // Verify admin auth
    await requireAuth(req);

    const { title, description, price, imageUrl, stock } = await req.json();

    if (!title || !price) {
      return Response.json(
        { error: 'Title and price are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO products (title, description, price, image_url, stock)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description || null, price, imageUrl || null, stock || 1]
    );

    return Response.json(result.rows[0]);
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  const { query } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');

  try {
    await requireAuth(req);

    const result = await query('SELECT * FROM products ORDER BY created_at DESC');
    return Response.json(result.rows);
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}
