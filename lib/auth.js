import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function createToken(adminId) {
  return jwt.sign({ adminId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function requireAuth(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw new Error('Unauthorized');
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw new Error('Invalid token');
  }

  return payload;
}
