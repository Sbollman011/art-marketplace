# Art Marketplace

A full-stack art selling platform with admin dashboard, payment processing, and notification system.

## Features

- 🎨 Browse and purchase artwork
- 📊 Admin dashboard to manage products and orders
- 💳 Stripe payment integration
- 📧 Email notifications (Resend)
- 📱 SMS notifications (Twilio)
- 🔐 Admin authentication

## Tech Stack

- **Frontend**: Next.js 15 + React 19
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Payments**: Stripe
- **Email**: Resend
- **SMS**: Twilio

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (free tier on Railway or Render)

### Installation

1. Clone and install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

3. Set up database:
```bash
npm run db:migrate
```

4. Run development server:
```bash
npm run dev
```

Visit http://localhost:3000

## Environment Setup

### Database (Free)
- **Railway**: https://railway.app (free tier with $5/month credit)
- **Render**: https://render.com (free tier, limited)
- **Supabase**: PostgreSQL hosting (free tier)

### Payments
- **Stripe**: https://stripe.com (free, pay per transaction)

### Email
- **Resend**: https://resend.com (1000 emails/day free)

### SMS
- **Twilio**: https://twilio.com (free trial $15 credit)

### Hosting
- **Vercel**: Deploy Next.js for free (https://vercel.com)

## Project Structure

```
/app              - Next.js app directory
  /api            - Backend API routes
  /admin          - Admin dashboard pages
  /page.js        - Public storefront
  /layout.js      - Root layout
/lib              - Utility functions, database client
/scripts          - Database migration scripts
/public           - Static assets
```

## Database Schema

See `scripts/schema.sql` for the complete database schema including:
- Products (artwork listings)
- Orders
- Customers
- Admin users
- Notifications log

## API Endpoints

- `GET /api/products` - List products
- `POST /api/orders` - Create order
- `POST /api/admin/products` - Create product (admin)
- `GET /api/admin/orders` - List orders (admin)

## Deployment

Deploy to Vercel (free):
```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard.

## Next Steps

1. Set up PostgreSQL database
2. Configure Stripe account
3. Configure Resend and Twilio
4. Build product listing page
5. Build admin dashboard
6. Implement checkout flow
