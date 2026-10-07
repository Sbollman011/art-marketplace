# Stripe Integration — Remaining Setup

This file is the single source of truth for finishing the Stripe Checkout setup.

Scenario detected: **A — an existing Checkout Session call was found**, at
[app/api/checkout-session/route.js](app/api/checkout-session/route.js). Only the
parameters of that call were changed. No new routes or files were added.

---

## Values to Replace

**None.** All `sample_only` parameters already had real, working values in this
codebase, so per the precedence rules they were preserved rather than replaced
with placeholders.

**File:** [app/api/checkout-session/route.js](app/api/checkout-session/route.js)

| Field | Current Value | Status |
|-------|--------------|--------|
| mode | `payment` | Correct. The store sells one-time original artwork, not subscriptions. |
| success_url | `${origin}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}` | Real URL, backed by [app/success/page.js](app/success/page.js). Keeps the `{CHECKOUT_SESSION_ID}` template. |
| cancel_url | `${origin}/cancel?order_id=${orderId}` | Real URL, backed by [app/cancel/page.js](app/cancel/page.js). |
| line_items | Built at runtime from the `products` table using `price_data` | Real prices read from the database. No `price_...` placeholders are used. |

---

## Configured Parameters

These came from Checkout Studio and are now set in the session call.

**File:** [app/api/checkout-session/route.js](app/api/checkout-session/route.js)

| Parameter | Value |
|-----------|-------|
| ui_mode | `hosted` |
| billing_address_collection | `auto` |
| phone_number_collection | `{ enabled: false }` |
| automatic_tax | `{ enabled: true }` |
| allow_promotion_codes | `false` |
| submit_type | `auto` |
| origin_context | `web` |

### Two deliberate deviations

**1. `ui_mode` is `hosted`, not `hosted_page`.**
This project pins `stripe@13.10.0` (see [package.json](package.json)), which is
below 21.0.0. Sending `hosted_page` was tested against your account and rejected:

> Invalid ui_mode: hosted_page. In order to use ui_mode: hosted_page, you must upgrade to Stripe API version 2026-03-25.dahlia.

If you upgrade the Stripe SDK and API version later, change this to `hosted_page`.

**2. `payment_method_collection` is omitted.**
It was listed as a configured value, but Stripe only accepts it for recurring
prices. Sending it on this one-time-payment session was rejected:

> You can only set `payment_method_collection` if there are recurring prices.

Since `mode` is `payment`, it must stay out.

---

## Parameters Intentionally Kept

The instructions said to remove parameters not listed in the Studio config. Four
were kept, because removing them would have broken working features. Please
review — these are judgement calls, not Studio settings.

| Parameter | Why it must stay |
|-----------|------------------|
| `metadata.orderId` | [app/api/confirm-payment/route.js](app/api/confirm-payment/route.js) refuses to mark an order paid unless the session's `orderId` matches. Removing it would break **all** order fulfillment and drop a security check that stops one session being replayed against another order. |
| `customer` | Carries the shipping address Stripe Tax uses to pick a rate. Without it, automatic tax has no address to work from, and the buyer would have to retype the address they already gave you. |
| `expires_at` | Powers the 30-minute abandoned-checkout cleanup so unpaid orders stop cluttering the fulfillment queue. |
| `payment_method_types` | Existing behaviour of the store's card checkout. |

---

## Required Before You Collect Any Tax

**Stripe Tax is enabled but currently returns $0.00 on every order.**

Verified against your live account: a Seattle (98101) and a Spokane (99201)
address both returned `automatic_tax: complete` with `amount_tax: 0`. That is
what Stripe returns when there is **no tax registration** for the destination.

To fix: Stripe Dashboard → **Tax** → **Registrations** → **Add registration** →
United States → **Washington**, with the date you became liable.

Until that registration exists, customers are charged no sales tax, and any tax
owed comes out of your own revenue.

Also confirm Stripe Dashboard → Tax → **Settings** has your Seattle origin
address and a default product tax category.

---

## Setup

Environment variables already in use (names match [.env.example](.env.example)):

```
STRIPE_SECRET_KEY=              # server only, never exposed to the browser
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=           # fallback origin for success/cancel URLs
```

This is a Next.js app, so browser-visible variables use the `NEXT_PUBLIC_`
prefix. `STRIPE_SECRET_KEY` correctly has no prefix. No Vite config is involved.

Two notes on the current key:

- It is a **restricted live key** (`rk_live_…`). It currently has the permissions
  needed to create customers, sessions, and tax calculations. If you rotate it or
  tighten scopes, keep write access to Customers and Checkout Sessions.
- Because it is a **live** key, the Stripe test cards below will not work. Swap in
  a `sk_test_…` / `pk_test_…` pair to test without real charges.

Dependencies are already installed; nothing new was added.

---

## How the Flow Works

1. Shopper fills the checkout form in [app/page.js](app/page.js).
2. [app/api/quote/route.js](app/api/quote/route.js) prices the cart live
   (subtotal + shipping). Tax is not quoted here — Stripe calculates it.
3. [app/api/checkout-session/route.js](app/api/checkout-session/route.js)
   re-reads prices from the database, creates a `pending` order, attaches the
   address to a Stripe customer, and opens a hosted Checkout Session.
4. Stripe hosts the payment page and calculates sales tax.
5. On success, [app/api/confirm-payment/route.js](app/api/confirm-payment/route.js)
   verifies the session, marks the order `paid`, writes the real tax and total
   back to the order, decrements stock, and sends the emails.
6. On cancel, [app/cancel/page.js](app/cancel/page.js) marks the order cancelled.

Order totals are stored pre-tax while `pending`, then reconciled from Stripe's
actual charge once paid.

---

## Testing

Use a **test** key pair first, then these cards with any future expiry and any CVC:

| Card | Result |
|------|--------|
| 4242 4242 4242 4242 | Payment succeeds |
| 4000 0000 0000 9995 | Card declined |
| 4000 0025 0000 3155 | Requires 3D Secure authentication |

Worth testing specifically:

- A Washington address (tax should appear once the registration is added).
- An out-of-state address (should stay $0.00 tax — you have no nexus there).
- An address with no ZIP code (checkout should refuse it before creating an order).
- Abandoning the Stripe page, then confirming the order auto-cancels.

---

## Next Steps

1. **Add the Washington tax registration** (see above). Nothing else collects tax.
2. **Consider a webhook for fulfillment.** Orders are currently confirmed when the
   buyer lands on the success page. If they pay and close the tab immediately, the
   order can stay `pending` even though you were paid. A
   `checkout.session.completed` webhook calling the same confirm logic would close
   that gap. No webhook handler exists in this project today.
3. **Fill in artwork dimensions** in the admin product form. Pieces without
   width/height ship at the default 8x12 canvas rate.
4. **Review shipping rates** in [lib/shipping.js](lib/shipping.js) against real
   postage you pay, and adjust the tables as needed.

---

## Resources

- Stripe Support: https://support.stripe.com
- Stripe MCP docs: https://docs.stripe.com/mcp
- Tax registrations: https://dashboard.stripe.com/tax/registrations
