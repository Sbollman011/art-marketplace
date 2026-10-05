export const dynamic = 'force-dynamic';

export async function GET(req) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  return new Response(JSON.stringify({
    cloudinaryConfigured: !!(cloudName && uploadPreset),
    cloudName: cloudName ? '✓ SET' : '✗ MISSING',
    uploadPreset: uploadPreset ? '✓ SET' : '✗ MISSING',
    message: 'Config check - check browser console for upload errors'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
