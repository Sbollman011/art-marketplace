export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

    if (!cloudName || !uploadPreset || !apiKey) {
      return Response.json({ error: 'Cloudinary is not configured' }, { status: 500 });
    }

    const cloudinaryForm = new FormData();
    cloudinaryForm.append('file', file);
    cloudinaryForm.append('upload_preset', uploadPreset);
    cloudinaryForm.append('api_key', apiKey);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: cloudinaryForm }
    );

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data.error?.message || 'Upload failed' },
        { status: 502 }
      );
    }

    return Response.json({
      url: data.secure_url,
      public_id: data.public_id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
