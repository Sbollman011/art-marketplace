import { query } from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return Response.json(result.rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
