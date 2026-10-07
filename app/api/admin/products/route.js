export const dynamic = 'force-dynamic';

function parseDimension(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseCategoryId(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function insertProduct(client, product) {
  const result = await client.query(
    `INSERT INTO products (title, description, price, image_url, stock, width_in, height_in, depth_in, category_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      product.title,
      product.description || null,
      product.price,
      product.imageUrl || null,
      product.stock ?? 1,
      parseDimension(product.widthIn),
      parseDimension(product.heightIn),
      parseDimension(product.depthIn),
      parseCategoryId(product.categoryId),
    ]
  );

  return result.rows[0];
}

export async function POST(req) {
  const { query, getClient } = await import('@/lib/db');
  const { requireAuth } = await import('@/lib/auth');

  try {
    // Verify admin auth
    await requireAuth(req);

    const payload = await req.json();
    const bulkProducts = Array.isArray(payload.products) ? payload.products : null;

    if (bulkProducts) {
      if (bulkProducts.length === 0) {
        return Response.json({ error: 'At least one product is required' }, { status: 400 });
      }

      const client = await getClient();

      try {
        await client.query('BEGIN');

        const created = [];

        for (const product of bulkProducts) {
          if (!product.title || product.price === undefined || product.price === null) {
            await client.query('ROLLBACK');
            return Response.json(
              { error: 'Each product needs a title and price' },
              { status: 400 }
            );
          }

          created.push(await insertProduct(client, product));
        }

        await client.query('COMMIT');
        return Response.json(created);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    const { title, description, price, imageUrl, stock, widthIn, heightIn, depthIn, categoryId } = payload;

    if (!title || price === undefined || price === null) {
      return Response.json(
        { error: 'Title and price are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO products (title, description, price, image_url, stock, width_in, height_in, depth_in, category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, description || null, price, imageUrl || null, stock || 1, parseDimension(widthIn), parseDimension(heightIn), parseDimension(depthIn), parseCategoryId(categoryId)]
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

    const result = await query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.created_at DESC`
    );
    return Response.json(result.rows);
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}
