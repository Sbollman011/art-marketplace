export const dynamic = 'force-dynamic';

export async function GET() {
  const { query } = await import('@/lib/db');

  try {
    // Only collections that actually hold artwork, so the storefront never shows
    // a filter that leads to an empty gallery.
    const result = await query(
      `SELECT c.id, c.name, c.description, COUNT(p.id)::int AS product_count
       FROM categories c
       JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.name ASC`
    );

    return Response.json(result.rows);
  } catch (error) {
    console.error('Category list error:', error);
    return Response.json({ error: 'Could not load collections' }, { status: 500 });
  }
}
