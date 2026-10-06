export const dynamic = 'force-dynamic';

import { query } from '@/lib/db';
import bcryptjs from 'bcryptjs';
import { createCustomerToken } from '@/lib/customer-auth';

export async function POST(req) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return Response.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Check if customer already exists
    const existingResult = await query(
      'SELECT id FROM customers WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (existingResult.rows.length > 0) {
      return Response.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);

    // Create customer
    const result = await query(
      `INSERT INTO customers (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [normalizedEmail, passwordHash, name]
    );

    const customer = result.rows[0];
    const token = createCustomerToken(customer.id, customer.email);

    return Response.json({
      customerToken: token,
      customerEmail: customer.email,
      isCustomer: true,
      isAdmin: false,
    });
  } catch (error) {
    console.error('Sign up error:', error);
    return Response.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
