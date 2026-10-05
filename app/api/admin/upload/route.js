export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { verifyToken, getTokenFromRequest } = await import('@/lib/auth');
    
    // Get token from Authorization header (verify admin is logged in)
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

    // Upload to Cloudinary using unsigned preset
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'GGG-GD');
    cloudinaryFormData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'hmunsrg');

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'hmunsrg'}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    );

    if (!cloudinaryRes.ok) {
      const error = await cloudinaryRes.json();
      console.error('Cloudinary error:', error);
      return Response.json({ error: 'Upload to Cloudinary failed' }, { status: 500 });
    }

    const result = await cloudinaryRes.json();

    return Response.json({
      imageUrl: result.secure_url,
      filename: result.public_id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
