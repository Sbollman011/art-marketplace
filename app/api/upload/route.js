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

    if (!cloudName || !uploadPreset) {
      return Response.json({
        error: 'Cloudinary not configured',
      }, { status: 500 });
    }

    // Convert file to bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', new Blob([buffer], { type: file.type }), file.name);
    cloudinaryFormData.append('upload_preset', uploadPreset);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    const cloudinaryRes = await fetch(uploadUrl, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    const uploadData = await cloudinaryRes.json();

    if (!cloudinaryRes.ok) {
      console.error('Cloudinary error:', uploadData);
      return Response.json({
        error: uploadData.error?.message || 'Upload failed',
      }, { status: 500 });
    }

    return Response.json({
      url: uploadData.secure_url,
      public_id: uploadData.public_id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
