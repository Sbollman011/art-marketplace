export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { verifyToken, getTokenFromRequest } = await import('@/lib/auth');
    const { v2: cloudinary } = await import('cloudinary');
    
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
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

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'goodness-gracious-gabriel',
          resource_type: 'auto',
          quality: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      uploadStream.end(Buffer.from(buffer));
    });

    return Response.json({
      imageUrl: result.secure_url,
      filename: result.public_id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Check if Cloudinary is not configured
    if (error.message?.includes('Must supply cloud_name')) {
      return Response.json({
        error: 'Cloudinary not configured. Please set CLOUDINARY environment variables.',
        details: 'Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env.local'
      }, { status: 500 });
    }
    
    return Response.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
