import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const PASSWORD_RESET_SECRET = JWT_SECRET;

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
  // Handle both direct property access and .get() method (Next.js 14 App Router)
  let authHeader = null;
  
  if (req.headers.get) {
    // Next.js 14 App Router
    authHeader = req.headers.get('authorization');
  } else {
    // Fallback for other environments
    authHeader = req.headers.authorization;
  }
  
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

export function createPasswordResetToken(customerId, email) {
  return jwt.sign({ customerId, email, type: 'password-reset' }, PASSWORD_RESET_SECRET, { expiresIn: '1h' });
}

export function verifyPasswordResetToken(token) {
  try {
    const payload = jwt.verify(token, PASSWORD_RESET_SECRET);
    if (payload.type !== 'password-reset') {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}
