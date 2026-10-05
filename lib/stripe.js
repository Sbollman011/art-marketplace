let stripe = null;

export function getStripe() {
  if (!stripe) {
    const Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

export async function createPaymentIntent(amount, orderId) {
  const stripeClient = getStripe();
  const paymentIntent = await stripeClient.paymentIntents.create({
    amount, // in cents
    currency: 'usd',
    metadata: { orderId },
  });

  return paymentIntent;
}

export async function retrievePaymentIntent(clientSecret) {
  const stripeClient = getStripe();
  const paymentIntent = await stripeClient.paymentIntents.retrieve(clientSecret);
  return paymentIntent;
}

export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}
