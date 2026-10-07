export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { requireAuth } = await import('@/lib/auth');

  try {
    await requireAuth(req);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const emailFrom = process.env.EMAIL_FROM;

    return Response.json({
      cloudinaryConfigured: !!(cloudName && uploadPreset),
      cloudName: cloudName ? '✓ SET' : '✗ MISSING',
      uploadPreset: uploadPreset ? '✓ SET' : '✗ MISSING',
      resendKey: process.env.RESEND_API_KEY ? '✓ SET' : '✗ MISSING',
      emailFrom: emailFrom || '✗ MISSING (falling back to onboarding@resend.dev)',
      message: 'Config check - check browser console for upload errors'
    });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Invalid token') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return Response.json({ error: 'Could not load config' }, { status: 500 });
  }
}
