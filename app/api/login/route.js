'use server';

import { query } from '@/lib/db';
import bcryptjs from 'bcryptjs';
import { createToken } from '@/lib/auth';
import { createCustomerToken } from '@/lib/customer-auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user is an admin
    const adminResult = await query(
      'SELECT id, password_hash FROM admins WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    // Check if user is a customer
    const customerResult = await query(
      'SELECT id, password_hash, email, name FROM customers WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    const isAdmin = adminResult.rows.length > 0;
    const isCustomer = customerResult.rows.length > 0;

    // If neither admin nor customer
    if (!isAdmin && !isCustomer) {
      return Response.json({ error: 'Account not found' }, { status: 401 });
    }

    // Verify admin password if applicable
    if (isAdmin) {
      const admin = adminResult.rows[0];
      const validPassword = await bcryptjs.compare(password, admin.password_hash);
      if (!validPassword) {
        return Response.json({ error: 'Invalid password' }, { status: 401 });
      }
    }

    // Verify customer password if applicable
    if (isCustomer) {
      const customer = customerResult.rows[0];
      const validPassword = await bcryptjs.compare(password, customer.password_hash);
      if (!validPassword) {
        return Response.json({ error: 'Invalid password' }, { status: 401 });
      }
    }

    // Build response based on what they are
    let response = {
      email: normalizedEmail,
      isAdmin,
      isCustomer,
    };

    if (isAdmin) {
      response.adminToken = createToken(adminResult.rows[0].id);
      response.adminEmail = normalizedEmail;
    }

    if (isCustomer) {
      const customer = customerResult.rows[0];
      response.customerToken = createCustomerToken(customer.id, normalizedEmail);
      response.customerEmail = normalizedEmail;
      response.customerName = customer.name;
    }

    return Response.json(response);
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
