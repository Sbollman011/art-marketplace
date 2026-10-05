export const dynamic = 'force-dynamic';

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';

export async function POST(req) {
  try {
    const { verifyToken, getTokenFromRequest } = await import('@/lib/auth');
    
    // Get token from Authorization header
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return Response.json({ error: 'Unauthorized - no token' }, { status: 401 });
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return Response.json({ error: 'Unauthorized - invalid token' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: 'File too large. Max 5MB.' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const filename = `${randomUUID()}.${ext}`;
    const filepath = join(uploadsDir, filename);

    // Write file to disk
    const buffer = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buffer));

    // Return the public URL
    const imageUrl = `/uploads/${filename}`;
    return Response.json({ imageUrl, filename });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
