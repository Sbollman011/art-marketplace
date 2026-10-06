export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'hmunsrg';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'TEST-UNSIGNED';

    console.log('Upload endpoint called');
    console.log('Cloud name:', cloudName);
    console.log('Upload preset:', uploadPreset);
    console.log('Env vars - CLOUD_NAME:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
    console.log('Env vars - PRESET:', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    console.log('File name:', file.name);
    console.log('File size:', file.size);
    console.log('File type:', file.type);

    if (!cloudName || !uploadPreset) {
      return Response.json({
        error: `Cloudinary not configured. Cloud: ${cloudName}, Preset: ${uploadPreset}`,
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
    console.log('Uploading to:', uploadUrl);

    const cloudinaryRes = await fetch(uploadUrl, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    const uploadData = await cloudinaryRes.json();

    console.log('Cloudinary response status:', cloudinaryRes.status);
    console.log('Cloudinary response:', uploadData);

    if (!cloudinaryRes.ok) {
      console.error('Cloudinary error details:', {
        status: cloudinaryRes.status,
        error: uploadData.error,
        full_response: uploadData
      });
      return Response.json({
        error: uploadData.error?.message || uploadData.message || 'Upload failed',
        debug: uploadData
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
