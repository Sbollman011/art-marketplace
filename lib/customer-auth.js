import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function createCustomerToken(customerId, email) {
  return jwt.sign({ customerId, email, type: 'customer' }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyCustomerToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== 'customer') {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

export function getCustomerTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function requireCustomerAuth(req) {
  const token = getCustomerTokenFromRequest(req);
  if (!token) {
    throw new Error('Unauthorized');
  }

  const payload = verifyCustomerToken(token);
  if (!payload) {
    throw new Error('Invalid token');
  }

  return payload;
}
