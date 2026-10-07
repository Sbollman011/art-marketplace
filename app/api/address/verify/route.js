export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { verifyShippingAddress } = await import('@/lib/address-verify');

  try {
    const { address } = await req.json();
    const result = await verifyShippingAddress(address);

    return Response.json(result, {
      status: result.verified ? 200 : 400,
    });
  } catch (error) {
    return Response.json(
      {
        verified: false,
        status: 'error',
        message: error.message || 'Address verification failed.',
      },
      { status: 500 }
    );
  }
}