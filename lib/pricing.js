import { parseShippingAddress } from './address';
import { calculateShippingCost } from './shipping';

/**
 * Single source of truth for pre-tax order math.
 * Sales tax is deliberately absent: Stripe Tax calculates it on the payment page
 * and confirm-payment writes the real amount back to the order.
 *
 * `items` must come from the database (price, quantity, width_in, height_in,
 * depth_in). Local pickup skips shipping entirely.
 */
export function calculateOrderTotals(items = [], rawShippingAddress = '', deliveryMethod = 'ship') {
  const isPickup = deliveryMethod === 'pickup';
  const destination = parseShippingAddress(rawShippingAddress);

  const subtotal = items.reduce((sum, item) => {
    const price = Number.parseInt(item.price, 10) || 0;
    const quantity = Number.parseInt(item.quantity, 10) || 0;
    return sum + price * quantity;
  }, 0);

  const shippingTotal = isPickup ? 0 : calculateShippingCost(items, destination);

  return {
    destination,
    isPickup,
    subtotal,
    shippingTotal,
    total: subtotal + shippingTotal,
  };
}
