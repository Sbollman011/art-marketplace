import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const result = await query('SELECT * FROM products ORDER BY created_at DESC');
    return Response.json(result.rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
