export const dynamic = 'force-dynamic';

export async function GET(req) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const emailFrom = process.env.EMAIL_FROM;

  return new Response(JSON.stringify({
    cloudinaryConfigured: !!(cloudName && uploadPreset),
    cloudName: cloudName ? '✓ SET' : '✗ MISSING',
    uploadPreset: uploadPreset ? '✓ SET' : '✗ MISSING',
    resendKey: process.env.RESEND_API_KEY ? '✓ SET' : '✗ MISSING',
    emailFrom: emailFrom || '✗ MISSING (falling back to onboarding@resend.dev)',
    message: 'Config check - check browser console for upload errors'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
