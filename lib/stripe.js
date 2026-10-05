import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(amount, orderId) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount, // in cents
    currency: 'usd',
    metadata: { orderId },
  });

  return paymentIntent;
}

export async function retrievePaymentIntent(clientSecret) {
  const paymentIntent = await stripe.paymentIntents.retrieve(clientSecret);
  return paymentIntent;
}

export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}
